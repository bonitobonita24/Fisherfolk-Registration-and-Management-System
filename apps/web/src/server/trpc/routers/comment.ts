import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { commentCreateSchema } from "@frms/shared/schemas";

import { sanitizePlainText } from "../../lib/sanitize";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const commentRouter = createTRPCRouter({
  listByFisherfolk: protectedProcedure
    .input(
      z
        .object({
          fisherfolkId: z.string().cuid(),
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { fisherfolkId, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        fisherfolkId,
      };

      const [items, total] = await Promise.all([
        ctx.db.comment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            mentionedUserIds: true,
            isTicket: true,
            ticketStatus: true,
            createdAt: true,
            author: { select: { id: true, name: true } },
          },
        }),
        ctx.db.comment.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  create: protectedProcedure
    .input(commentCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.comment.create({
        data: {
          content: sanitizePlainText(input.content),
          fisherfolkId: input.fisherfolkId,
          mentionedUserIds: input.mentionedUserIds,
          isTicket: input.isTicket ?? false,
          ...(input.ticketStatus !== undefined && {
            ticketStatus: input.ticketStatus,
          }),
          tenantId: ctx.tenantId,
          authorId: ctx.userId,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.comment.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      if (
        existing.authorId !== ctx.userId &&
        ctx.role !== "tenant_superadmin" &&
        ctx.role !== "tenant_admin" &&
        ctx.role !== "tenant_manager"
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.comment.delete({ where: { id: input.id } });
    }),
});
