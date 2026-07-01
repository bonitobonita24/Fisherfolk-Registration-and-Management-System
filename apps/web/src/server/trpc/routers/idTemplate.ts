import type { Prisma } from "@frms/db";
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

      const created = await ctx.db.iDTemplate.create({
        data: omitUndefined({
          ...input,
          tenantId: ctx.tenantId,
          createdById: ctx.userId!,
        }),
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "CREATE",
          entityType: "IDTemplate",
          entityId: created.id,
          after: created as unknown as Record<string, unknown>,
        },
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

      const updated = await ctx.db.iDTemplate.update({
        where: { id: input.id },
        data: omitUndefined(updateData),
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
