import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  idTemplateCreateSchema,
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

      return ctx.db.iDTemplate.create({
        data: omitUndefined({
          ...input,
          tenantId: ctx.tenantId,
          createdById: ctx.userId!,
        }),
      });
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

      return ctx.db.iDTemplate.update({
        where: { id: input.id },
        data: omitUndefined(updateData),
      });
    }),

  archive: adminProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.iDTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.iDTemplate.update({
        where: { id: input.id },
        data: { status: "ARCHIVED" },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.iDTemplate.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.iDTemplate.delete({ where: { id: input.id } });
    }),
});
