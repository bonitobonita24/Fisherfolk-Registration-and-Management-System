import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { buildQRPayload } from "@/lib/qr-code";

import { omitUndefined } from "../../lib/prisma-input";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";

const vesselStatusEnum = z.enum(["ACTIVE", "IMPOUNDED", "INACTIVE"]);

export const vesselRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          search: z.string().optional(),
          status: vesselStatusEnum.optional(),
          fisherfolkId: z.string().cuid().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { page, limit, search, status, fisherfolkId } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        ...(status && { status }),
        ...(fisherfolkId && { owners: { some: { id: fisherfolkId } } }),
        ...(search && {
          OR: [
            { mfvrNumber: { contains: search, mode: "insensitive" as const } },
            { vesselName: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.vessel.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            mfvrNumber: true,
            vesselName: true,
            vesselType: true,
            status: true,
            createdAt: true,
          },
        }),
        ctx.db.vessel.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const record = await ctx.db.vessel.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          owners: {
            select: { id: true, fullName: true, idNumber: true, status: true },
          },
          violations: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, subject: true, status: true, createdAt: true },
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
          mfvrNumber: z.string().min(1),
          vesselName: z.string().optional(),
          vesselType: z.string().min(1),
          hullMaterial: z.string().optional(),
          placeBuilt: z.string().optional(),
          yearBuilt: z.number().int().min(1900).max(2100).optional(),
          registeredLength: z.number().positive().optional(),
          registeredBreadth: z.number().positive().optional(),
          registeredDepth: z.number().positive().optional(),
          grossTonnage: z.number().positive().optional(),
          netTonnage: z.number().positive().optional(),
          engineMake: z.string().optional(),
          engineSerialNumber: z.string().optional(),
          horsepower: z.number().positive().optional(),
          homeport: z.string().optional(),
          fishingGearClassification: z.array(z.string()).default([]),
          vesselPhoto: z.string().optional(),
          ownerIds: z.array(z.string().cuid()).default([]),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;
      const { ownerIds, ...data } = input;

      const existing = await ctx.db.vessel.findFirst({
        where: { mfvrNumber: input.mfvrNumber, tenantId },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "A vessel with this MFVR number already exists." });
      }

      const record = await ctx.db.$transaction(async (tx) => {
        const created = await tx.vessel.create({
          data: {
            ...omitUndefined(data),
            tenantId,
            createdById: userId,
            ...(ownerIds.length > 0 && {
              owners: { connect: ownerIds.map((id) => ({ id })) },
            }),
          },
        });

        const qrPayload = buildQRPayload({
          id: created.id,
          regNo: created.mfvrNumber,
          tenantId,
        });

        return tx.vessel.update({
          where: { id: created.id },
          data: { qrCode: qrPayload },
        });
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "CREATE",
          entityType: "Vessel",
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
          vesselName: z.string().optional(),
          vesselType: z.string().optional(),
          hullMaterial: z.string().optional(),
          placeBuilt: z.string().optional(),
          yearBuilt: z.number().int().min(1900).max(2100).optional(),
          registeredLength: z.number().positive().optional(),
          registeredBreadth: z.number().positive().optional(),
          registeredDepth: z.number().positive().optional(),
          grossTonnage: z.number().positive().optional(),
          netTonnage: z.number().positive().optional(),
          engineMake: z.string().optional(),
          engineSerialNumber: z.string().optional(),
          horsepower: z.number().positive().optional(),
          homeport: z.string().optional(),
          fishingGearClassification: z.array(z.string()).optional(),
          status: vesselStatusEnum.optional(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;

      const existing = await ctx.db.vessel.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.vessel.update({
        where: { id },
        data: { ...omitUndefined(data), updatedById: ctx.userId! },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "Vessel",
          entityId: id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return updated;
    }),
});
