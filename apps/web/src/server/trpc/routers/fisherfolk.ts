import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  fisherfolkCreateSchema,
  fisherfolkUpdateSchema,
} from "@frms/shared/schemas";

import { omitUndefined } from "../../lib/prisma-input";
import {
  adminProcedure,
  createTRPCRouter,
  encoderProcedure,
  protectedProcedure,
} from "../trpc";

export const fisherfolkRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          search: z.string().optional(),
          status: z
            .enum(["NEW", "ACTIVE", "RENEWED", "INACTIVE", "ARCHIVED"])
            .optional(),
          barangay: z.string().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { page, limit, search, status, barangay } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        ...(status && { status }),
        ...(barangay && { barangay }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { idNumber: { contains: search, mode: "insensitive" as const } },
            { contactNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.fisherfolk.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            idNumber: true,
            fullName: true,
            barangay: true,
            contactNumber: true,
            status: true,
            createdAt: true,
          },
        }),
        ctx.db.fisherfolk.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const record = await ctx.db.fisherfolk.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          vessels: {
            where: { status: "ACTIVE" },
            select: {
              id: true,
              mfvrNumber: true,
              vesselName: true,
              vesselType: true,
              status: true,
            },
          },
          violations: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              subject: true,
              targetType: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      return record;
    }),

  generateNextIdNumber: encoderProcedure
    .input(z.object({ year: z.number().int().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const year = input?.year ?? new Date().getFullYear();
      const prefix = `FF-${year}-`;

      const last = await ctx.db.fisherfolk.findFirst({
        where: {
          tenantId: ctx.tenantId,
          idNumber: { startsWith: prefix },
        },
        orderBy: { idNumber: "desc" },
        select: { idNumber: true },
      });

      let nextSeq = 1;
      if (last) {
        const tail = last.idNumber.slice(prefix.length);
        const parsed = Number.parseInt(tail, 10);
        if (Number.isFinite(parsed) && parsed > 0) nextSeq = parsed + 1;
      }

      const idNumber = `${prefix}${nextSeq.toString().padStart(4, "0")}`;
      return { idNumber, year, sequence: nextSeq };
    }),

  create: encoderProcedure
    .input(fisherfolkCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.fisherfolk.findFirst({
        where: { idNumber: input.idNumber, tenantId: ctx.tenantId },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Invalid input.",
        });
      }

      const record = await ctx.db.fisherfolk.create({
        data: omitUndefined({
          ...input,
          tenantId: ctx.tenantId,
          createdById: ctx.userId!,
          updatedById: ctx.userId!,
        }),
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "CREATE",
          entityType: "Fisherfolk",
          entityId: record.id,
          after: record as unknown as Record<string, unknown>,
        },
      });

      return record;
    }),

  update: adminProcedure
    .input(fisherfolkUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;

      const existing = await ctx.db.fisherfolk.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.fisherfolk.update({
        where: { id },
        data: omitUndefined({ ...data, updatedById: ctx.userId! }),
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "Fisherfolk",
          entityId: id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return updated;
    }),

  archive: adminProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.fisherfolk.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.fisherfolk.update({
        where: { id: input.id },
        data: { status: "ARCHIVED", updatedById: ctx.userId! },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "Fisherfolk",
          entityId: input.id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return { success: true };
    }),
});
