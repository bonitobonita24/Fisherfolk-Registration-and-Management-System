import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, adminProcedure } from "../trpc";

export const auditLogRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          action: z
            .enum([
              "CREATE",
              "UPDATE",
              "DELETE",
              "REQUEST",
              "APPROVE",
              "REJECT",
              "RENEW",
              "PRINT",
              "VIOLATION_FILED",
              "VIOLATION_LIFTED",
              "LOGIN",
              "EXPORT",
              "MEDIA_DOWNLOAD",
              "EXPIRE",
            ])
            .optional(),
          entityType: z.string().optional(),
          userId: z.string().optional(),
          dateFrom: z.date().optional(),
          dateTo: z.date().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { page, limit, action, entityType, userId, dateFrom, dateTo } =
        input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        ...(action && { action }),
        ...(entityType && { entityType }),
        ...(userId && { userId }),
        ...((dateFrom ?? dateTo) && {
          createdAt: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            before: true,
            after: true,
            createdAt: true,
            user: { select: { id: true, name: true } },
          },
        }),
        ctx.db.auditLog.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const log = await ctx.db.auditLog.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
      });

      if (!log) throw new TRPCError({ code: "NOT_FOUND" });
      return log;
    }),
});
