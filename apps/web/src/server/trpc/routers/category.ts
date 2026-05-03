import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { omitUndefined } from "../../lib/prisma-input";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";

export const categoryRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["ACTIVE", "DISABLED"]).optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { status } = input;

      return ctx.db.category.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(status && { status }),
        },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          displayColor: true,
          iconType: true,
          iconEmoji: true,
          iconImageUrl: true,
          displayOrder: true,
          status: true,
          createdAt: true,
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const record = await ctx.db.category.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      return record;
    }),

  create: adminProcedure
    .input(
      z
        .object({
          name: z.string().min(1).max(100),
          description: z.string().optional(),
          slug: z
            .string()
            .min(1)
            .max(100)
            .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
          displayColor: z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
          iconType: z.enum(["EMOJI", "IMAGE"]).optional(),
          iconEmoji: z.string().optional(),
          iconImageUrl: z.string().url().optional(),
          displayOrder: z.number().int().min(0).default(0),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.category.findFirst({
        where: { tenantId: ctx.tenantId, slug: input.slug },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Invalid input." });
      }

      const record = await ctx.db.category.create({
        data: omitUndefined({
          tenantId: ctx.tenantId,
          name: input.name,
          description: input.description,
          slug: input.slug,
          displayColor: input.displayColor,
          iconType: input.iconType,
          iconEmoji: input.iconEmoji,
          iconImageUrl: input.iconImageUrl,
          displayOrder: input.displayOrder,
        }),
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "CREATE",
          entityType: "Category",
          entityId: record.id,
          after: record as unknown as Record<string, unknown>,
        },
      });

      return record;
    }),

  update: adminProcedure
    .input(
      z
        .object({
          id: z.string().cuid(),
          name: z.string().min(1).max(100).optional(),
          description: z.string().optional(),
          slug: z
            .string()
            .min(1)
            .max(100)
            .regex(/^[a-z0-9-]+$/)
            .optional(),
          displayColor: z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
          iconType: z.enum(["EMOJI", "IMAGE"]).optional(),
          iconEmoji: z.string().optional(),
          iconImageUrl: z.string().url().optional(),
          displayOrder: z.number().int().min(0).optional(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const { id, ...data } = input;

      const existing = await ctx.db.category.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      if (data.slug && data.slug !== existing.slug) {
        const slugConflict = await ctx.db.category.findFirst({
          where: { tenantId: ctx.tenantId, slug: data.slug, id: { not: id } },
        });
        if (slugConflict) {
          throw new TRPCError({ code: "CONFLICT", message: "Invalid input." });
        }
      }

      const updated = await ctx.db.category.update({
        where: { id },
        data: omitUndefined(data),
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "Category",
          entityId: id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return updated;
    }),

  disable: adminProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.category.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.category.update({
        where: { id: input.id },
        data: { status: "DISABLED" },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "Category",
          entityId: input.id,
          before: { status: existing.status } as Record<string, unknown>,
          after: { status: updated.status } as Record<string, unknown>,
        },
      });

      return updated;
    }),
});
