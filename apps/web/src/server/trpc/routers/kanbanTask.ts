import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  kanbanTaskCreateSchema,
  kanbanTaskSourceEntityTypeSchema,
  kanbanTaskUpdateSchema,
} from "@frms/shared/schemas";

import { omitUndefined } from "../../lib/prisma-input";
import type { TRPCContext } from "../context";
import { createTRPCRouter, protectedProcedure } from "../trpc";

type SourceEntityType = z.infer<typeof kanbanTaskSourceEntityTypeSchema>;

async function assertSourceEntityExists(
  db: TRPCContext["db"],
  tenantId: string,
  sourceEntityType: SourceEntityType,
  sourceEntityId: string,
) {
  const where = { id: sourceEntityId, tenantId };
  let found: unknown = null;
  switch (sourceEntityType) {
    case "fisherfolk":
      found = await db.fisherfolk.findFirst({ where });
      break;
    case "vessel":
      found = await db.vessel.findFirst({ where });
      break;
    case "violation":
      found = await db.violation.findFirst({ where });
      break;
    case "ayudaProgram":
      found = await db.ayudaProgram.findFirst({ where });
      break;
  }
  if (found === null || found === undefined) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Source record not found",
    });
  }
}

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
          assignedToMe: z.boolean().optional(),
          sourceEntityType: kanbanTaskSourceEntityTypeSchema.optional(),
          sourceEntityId: z.string().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const {
        page,
        limit,
        status,
        priority,
        assignedToId,
        assignedToMe,
        sourceEntityType,
        sourceEntityId,
      } = input;
      const skip = (page - 1) * limit;

      const where = omitUndefined({
        tenantId: ctx.tenantId,
        status,
        priority,
        assignedToId: assignedToMe === true ? ctx.userId : assignedToId,
        sourceEntityType,
        sourceEntityId,
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
            dueDate: true,
            sourceEntityType: true,
            sourceEntityId: true,
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

      if (input.sourceEntityType && input.sourceEntityId) {
        await assertSourceEntityExists(
          ctx.db,
          ctx.tenantId,
          input.sourceEntityType,
          input.sourceEntityId,
        );
      }

      return ctx.db.kanbanTask.create({
        data: omitUndefined({
          ...input,
          assignedToId: input.assignedToId ?? ctx.userId,
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

      if (updateData.sourceEntityType && updateData.sourceEntityId) {
        await assertSourceEntityExists(
          ctx.db,
          ctx.tenantId,
          updateData.sourceEntityType,
          updateData.sourceEntityId,
        );
      }

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
