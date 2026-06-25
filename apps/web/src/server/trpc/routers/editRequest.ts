import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { fisherfolkUpdateSchema } from "@frms/shared/schemas";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";

// Derive allowed editable-field keys from fisherfolkUpdateSchema (excludes "id").
const ALLOWED_FISHERFOLK_CHANGE_KEYS = new Set(
  Object.keys(fisherfolkUpdateSchema.shape).filter((k) => k !== "id"),
);

export const editRequestRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          status: z
            .enum(["PENDING", "APPROVED", "REJECTED"])
            .optional(),
          fisherfolkId: z.string().cuid().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { page, limit, status, fisherfolkId } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        ...(status && { status }),
        ...(fisherfolkId && { fisherfolkId }),
      };

      const [items, total] = await Promise.all([
        ctx.db.editRequest.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fieldChanges: true,
            status: true,
            createdAt: true,
            fisherfolk: {
              select: { id: true, fullName: true, idNumber: true },
            },
            requestedBy: { select: { id: true, name: true } },
            reviewedBy: { select: { id: true, name: true } },
            reviewedAt: true,
            rejectionReason: true,
          },
        }),
        ctx.db.editRequest.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const record = await ctx.db.editRequest.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          fisherfolk: {
            select: { id: true, fullName: true, idNumber: true },
          },
          requestedBy: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, name: true } },
        },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      return record;
    }),

  create: protectedProcedure
    .input(
      z
        .object({
          fisherfolkId: z.string().cuid(),
          fieldChanges: z.record(z.unknown()),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Validate fieldChanges keys against the allowed editable-field set.
      const changeKeys = Object.keys(input.fieldChanges);
      if (changeKeys.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No valid changes." });
      }
      const invalidKey = changeKeys.find(
        (k) => !ALLOWED_FISHERFOLK_CHANGE_KEYS.has(k),
      );
      if (invalidKey !== undefined) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid field in changes.",
        });
      }

      const fisherfolk = await ctx.db.fisherfolk.findFirst({
        where: { id: input.fisherfolkId, tenantId: ctx.tenantId },
      });
      if (!fisherfolk) throw new TRPCError({ code: "NOT_FOUND" });

      const record = await ctx.db.editRequest.create({
        data: {
          tenantId: ctx.tenantId,
          fisherfolkId: input.fisherfolkId,
          requestedById: ctx.userId,
          fieldChanges: input.fieldChanges,
        },
        select: {
          id: true,
          fieldChanges: true,
          status: true,
          createdAt: true,
        },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          action: "CREATE",
          entityType: "EditRequest",
          entityId: record.id,
          after: record as unknown as Record<string, unknown>,
        },
      });

      return record;
    }),

  approve: adminProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.editRequest.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid input." });
      }

      const fieldChanges = existing.fieldChanges as Record<string, unknown>;

      const [updated] = await ctx.db.$transaction([
        ctx.db.editRequest.update({
          where: { id: input.id },
          data: {
            status: "APPROVED",
            reviewedById: ctx.userId,
            reviewedAt: new Date(),
          },
        }),
        ctx.db.fisherfolk.update({
          where: { id: existing.fisherfolkId },
          data: fieldChanges,
        }),
      ]);

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "EditRequest",
          entityId: input.id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return updated;
    }),

  reject: adminProcedure
    .input(
      z
        .object({
          id: z.string().cuid(),
          rejectionReason: z.string().min(1),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.editRequest.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid input." });
      }

      const updated = await ctx.db.editRequest.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          reviewedById: ctx.userId!,
          reviewedAt: new Date(),
          rejectionReason: input.rejectionReason,
        },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "EditRequest",
          entityId: input.id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return updated;
    }),

  history: protectedProcedure
    .input(z.object({ fisherfolkId: z.string().cuid() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const items = await ctx.db.editRequest.findMany({
        where: { fisherfolkId: input.fisherfolkId, tenantId: ctx.tenantId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fieldChanges: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          rejectionReason: true,
          requestedBy: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, name: true } },
        },
      });

      return { items };
    }),
});
