import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { omitUndefined } from "../../lib/prisma-input";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";

export const violationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          search: z.string().optional(),
          status: z.enum(["ACTIVE", "LIFTED", "ARCHIVED"]).optional(),
          fisherfolkId: z.string().cuid().optional(),
          vesselId: z.string().cuid().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { page, limit, search, status, fisherfolkId, vesselId } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        ...(status && { status }),
        ...(fisherfolkId && { fisherfolkId }),
        ...(vesselId && { vesselId }),
        ...(search && {
          subject: { contains: search, mode: "insensitive" as const },
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.violation.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            subject: true,
            targetType: true,
            status: true,
            createdAt: true,
            fisherfolk: { select: { id: true, fullName: true } },
            vessel: { select: { id: true, mfvrNumber: true, vesselName: true } },
            filedBy: { select: { id: true, name: true } },
          },
        }),
        ctx.db.violation.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const record = await ctx.db.violation.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          fisherfolk: {
            select: {
              id: true,
              fullName: true,
              idNumber: true,
              photo: true,
              barangay: true,
              status: true,
              rsbsaNumber: true,
              sex: true,
              civilStatus: true,
              dateOfBirth: true,
              contactNumber: true,
              registrationYear: true,
            },
          },
          vessel: {
            select: { id: true, mfvrNumber: true, vesselName: true },
          },
          filedBy: { select: { id: true, name: true } },
          liftedBy: { select: { id: true, name: true } },
          attachments: {
            orderBy: { uploadedAt: "asc" },
          },
        },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      return record;
    }),

  create: adminProcedure
    .input(
      z
        .object({
          targetType: z.enum(["FISHERFOLK", "VESSEL", "BOTH"]),
          fisherfolkId: z.string().cuid().optional(),
          vesselId: z.string().cuid().optional(),
          subject: z.string().min(1),
          details: z.string().optional(),
          evidenceImages: z.array(z.string()).default([]),
          notes: z.string().optional(),
          violatorName: z.string().max(255).optional(),
          attachments: z
            .array(
              z.object({
                filePath: z.string().min(1),
                originalFilename: z.string().min(1).max(255),
                mimeType: z.string().min(1),
                fileSize: z.number().int().positive(),
              }),
            )
            .default([]),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const { attachments, ...rest } = input;

      const record = await ctx.db.violation.create({
        data: {
          ...omitUndefined(rest),
          tenantId: ctx.tenantId,
          filedById: ctx.userId!,
          ...(attachments.length > 0 && {
            attachments: {
              create: attachments.map((a) => ({
                filePath: a.filePath,
                originalFilename: a.originalFilename,
                mimeType: a.mimeType,
                fileSize: a.fileSize,
                uploadedById: ctx.userId!,
              })),
            },
          }),
        },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "CREATE",
          entityType: "Violation",
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
          subject: z.string().min(1).optional(),
          details: z.string().optional(),
          evidenceImages: z.array(z.string()).optional(),
          notes: z.string().optional(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const { id, ...rest } = input;
      const existing = await ctx.db.violation.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid input.",
        });
      }

      const updated = await ctx.db.violation.update({
        where: { id },
        data: omitUndefined(rest),
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "Violation",
          entityId: id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return updated;
    }),

  lift: adminProcedure
    .input(
      z
        .object({
          id: z.string().cuid(),
          resolutionNotes: z.string().min(1),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.violation.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid input.",
        });
      }

      const updated = await ctx.db.violation.update({
        where: { id: input.id },
        data: {
          status: "LIFTED",
          liftedById: ctx.userId!,
          liftedAt: new Date(),
          resolutionNotes: input.resolutionNotes,
        },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "Violation",
          entityId: input.id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return updated;
    }),
});
