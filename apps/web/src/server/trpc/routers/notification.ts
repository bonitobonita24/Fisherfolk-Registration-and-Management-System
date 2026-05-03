import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const notificationRouter = createTRPCRouter({
  listUnread: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(20),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        isRead: false,
      };

      const [items, total] = await Promise.all([
        ctx.db.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            entityType: true,
            entityId: true,
            isRead: true,
            createdAt: true,
          },
        }),
        ctx.db.notification.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  listAll: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(20),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
      };

      const [items, total] = await Promise.all([
        ctx.db.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            entityType: true,
            entityId: true,
            isRead: true,
            createdAt: true,
          },
        }),
        ctx.db.notification.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    const count = await ctx.db.notification.count({
      where: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        isRead: false,
      },
    });

    return { count };
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const existing = await ctx.db.notification.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
          userId: ctx.userId,
        },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.notification.update({
        where: { id: input.id },
        data: { isRead: true },
        select: {
          id: true,
          isRead: true,
        },
      });

      return updated;
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    const result = await ctx.db.notification.updateMany({
      where: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { updated: result.count };
  }),
});
