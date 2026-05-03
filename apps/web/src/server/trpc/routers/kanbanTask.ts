import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  kanbanTaskCreateSchema,
  kanbanTaskUpdateSchema,
} from "@frms/shared/schemas";

import { omitUndefined } from "../../lib/prisma-input";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const kanbanTaskRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
          priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
          assignedToId: z.string().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { page, limit, status, priority, assignedToId } = input;
      const skip = (page - 1) * limit;

      const where = omitUndefined({
        tenantId: ctx.tenantId,
        status,
        priority,
        assignedToId,
      });

      const [items, total] = await Promise.all([
        ctx.db.kanbanTask.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            createdAt: true,
            assignedTo: { select: { id: true, name: true } },
          },
        }),
        ctx.db.kanbanTask.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const task = await ctx.db.kanbanTask.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          assignedTo: { select: { id: true, name: true } },
          sourceComment: { select: { id: true, content: true } },
        },
      });

      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      return task;
    }),

  create: protectedProcedure
    .input(kanbanTaskCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.kanbanTask.create({
        data: omitUndefined({
          ...input,
          tenantId: ctx.tenantId,
        }),
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: kanbanTaskUpdateSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.kanbanTask.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const { id: _ignored, ...updateData } = input.data;

      return ctx.db.kanbanTask.update({
        where: { id: input.id },
        data: omitUndefined(updateData),
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.kanbanTask.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.kanbanTask.delete({ where: { id: input.id } });
    }),

  updateStatus: protectedProcedure
    .input(
      z
        .object({
          id: z.string(),
          status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.kanbanTask.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.kanbanTask.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),
});
