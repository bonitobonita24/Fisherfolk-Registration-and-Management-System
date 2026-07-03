import type { Prisma, prisma } from "@frms/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  idTemplateCreateSchema,
  idTemplateDuplicateSchema,
  idTemplateUpdateSchema,
} from "@frms/shared/schemas";

import { omitUndefined } from "../../lib/prisma-input";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";

/** Interactive-transaction client of the app's (extended) Prisma client. */
type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Single-active invariant: at most ONE ACTIVE template per (tenant, templateType).
 * Archives every other ACTIVE template of the same type inside the caller's
 * transaction and writes one UPDATE audit entry per demoted template.
 */
async function archiveOtherActives(
  tx: TxClient,
  opts: {
    tenantId: string;
    userId: string;
    templateType: "FISHERFOLK" | "VESSEL";
    exceptId?: string;
  },
): Promise<void> {
  const { tenantId, userId, templateType, exceptId } = opts;

  const others = await tx.iDTemplate.findMany({
    where: {
      tenantId,
      templateType,
      status: "ACTIVE",
      ...(exceptId && { id: { not: exceptId } }),
    },
  });
  if (others.length === 0) return;

  await tx.iDTemplate.updateMany({
    where: { id: { in: others.map((t) => t.id) } },
    data: { status: "ARCHIVED" },
  });

  for (const t of others) {
    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "UPDATE",
        entityType: "IDTemplate",
        entityId: t.id,
        before: t as unknown as Record<string, unknown>,
        after: { ...t, status: "ARCHIVED" } as unknown as Record<string, unknown>,
      },
    });
  }
}

export const idTemplateRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

    return ctx.db.iDTemplate.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const template = await ctx.db.iDTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!template) throw new TRPCError({ code: "NOT_FOUND" });
      return template;
    }),

  getActive: protectedProcedure
    .input(z.object({ templateType: z.enum(["FISHERFOLK", "VESSEL"]) }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const template = await ctx.db.iDTemplate.findFirst({
        where: {
          tenantId: ctx.tenantId,
          templateType: input.templateType,
          status: "ACTIVE",
        },
      });

      if (!template) throw new TRPCError({ code: "NOT_FOUND" });
      return template;
    }),

  create: adminProcedure
    .input(idTemplateCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;

      // Prisma default is ACTIVE, so an omitted status also counts as ACTIVE.
      const willBeActive = input.status !== "ARCHIVED";

      const created = await ctx.db.$transaction(async (tx) => {
        if (willBeActive) {
          await archiveOtherActives(tx, {
            tenantId,
            userId,
            templateType: input.templateType,
          });
        }

        const row = await tx.iDTemplate.create({
          data: omitUndefined({
            ...input,
            tenantId,
            createdById: userId,
          }),
        });

        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: "CREATE",
            entityType: "IDTemplate",
            entityId: row.id,
            after: row as unknown as Record<string, unknown>,
          },
        });

        return row;
      });

      return created;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: idTemplateUpdateSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.iDTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const { id: _ignored, ...updateData } = input.data;
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;

      const updated = await ctx.db.$transaction(async (tx) => {
        // Keep the single-active invariant when this update (re)activates.
        if (updateData.status === "ACTIVE") {
          await archiveOtherActives(tx, {
            tenantId,
            userId,
            templateType: existing.templateType,
            exceptId: input.id,
          });
        }

        const row = await tx.iDTemplate.update({
          where: { id: input.id },
          data: omitUndefined(updateData),
        });

        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: "UPDATE",
            entityType: "IDTemplate",
            entityId: input.id,
            before: existing as unknown as Record<string, unknown>,
            after: row as unknown as Record<string, unknown>,
          },
        });

        return row;
      });

      return updated;
    }),

  /**
   * Make one template THE active template for its (tenant, templateType) —
   * activates it and archives every other ACTIVE template of the same type.
   * The active template is what the ID Generator auto-loads for printing.
   */
  setActive: adminProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;

      const existing = await ctx.db.iDTemplate.findFirst({
        where: { id: input.id, tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.$transaction(async (tx) => {
        await archiveOtherActives(tx, {
          tenantId,
          userId,
          templateType: existing.templateType,
          exceptId: input.id,
        });

        const row = await tx.iDTemplate.update({
          where: { id: input.id },
          data: { status: "ACTIVE" },
        });

        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: "UPDATE",
            entityType: "IDTemplate",
            entityId: input.id,
            before: existing as unknown as Record<string, unknown>,
            after: row as unknown as Record<string, unknown>,
          },
        });

        return row;
      });

      return updated;
    }),

  archive: adminProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.iDTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.iDTemplate.update({
        where: { id: input.id },
        data: { status: "ARCHIVED" },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "IDTemplate",
          entityId: input.id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.iDTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const deleted = await ctx.db.iDTemplate.delete({ where: { id: input.id } });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "DELETE",
          entityType: "IDTemplate",
          entityId: input.id,
          before: existing as unknown as Record<string, unknown>,
        },
      });

      return deleted;
    }),

  // Produces a copy of the source template with status ARCHIVED so that
  // getActive (filters on status=ACTIVE) remains deterministic.
  // IDTemplateStatus only has ACTIVE|ARCHIVED — no DRAFT variant exists.
  duplicate: adminProcedure
    .input(idTemplateDuplicateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const source = await ctx.db.iDTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!source) throw new TRPCError({ code: "NOT_FOUND" });

      const copy = await ctx.db.iDTemplate.create({
        data: {
          tenantId: ctx.tenantId,
          name: `${source.name} (copy)`,
          templateType: source.templateType,
          frontBackgroundUrl: source.frontBackgroundUrl,
          backBackgroundUrl: source.backBackgroundUrl,
          frontElements: source.frontElements as Prisma.InputJsonValue,
          backElements: source.backElements as Prisma.InputJsonValue,
          status: "ARCHIVED",
          createdById: ctx.userId!,
        },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "CREATE",
          entityType: "IDTemplate",
          entityId: copy.id,
          after: copy as unknown as Record<string, unknown>,
        },
      });

      return copy;
    }),
});
