import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Prisma } from "@frms/db";
import {
  fishCatchCreateSchema,
  fishCatchUpdateSchema,
  gearTypeSchema,
  catchDispositionSchema,
} from "@frms/shared/schemas";

import { omitUndefined } from "../../lib/prisma-input";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";

/**
 * Prisma `Decimal` fields serialize to opaque objects over the wire (and
 * choke `JSON`-typed AuditLog columns). Convert to a plain number/undefined
 * before returning to the client / writing to AuditLog.
 */
function decToNum<T>(value: T): number | null {
  if (value === null || value === undefined) return null;
  const v = value as unknown as { toNumber?: () => number };
  return typeof v.toNumber === "function" ? v.toNumber() : Number(value);
}

/** Same conversion for REQUIRED (non-nullable) Decimal columns. */
function decToNumRequired<T>(value: T): number {
  const v = value as unknown as { toNumber?: () => number };
  return typeof v.toNumber === "function" ? v.toNumber() : Number(value);
}

/** Strip Decimal/Date instances down to plain JSON for AuditLog `Json` columns. */
function toAuditJson(record: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(record)) as Record<string, unknown>;
}

/**
 * NOTE: Decimal→number conversion for FishCatch (+species) records is
 * deliberately inlined at each call site (getById/create/update) rather
 * than factored into a shared generic helper. Spreading a *generic* type
 * parameter with a same-key override produces a TS intersection
 * (`Decimal & number`) instead of an override, silently leaking Prisma's
 * `Decimal` back into the inferred tRPC output type. Concrete (non-generic)
 * object literals override keys correctly.
 */

const fisherfolkSelect = {
  id: true,
  firstName: true,
  lastName: true,
  idNumber: true,
} as const;

const vesselSelect = {
  id: true,
  mfvrNumber: true,
  vesselName: true,
} as const;

export const fishCatchRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          search: z.string().optional(),
          fisherfolkId: z.string().cuid().optional(),
          gearType: gearTypeSchema.optional(),
          barangay: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          disposition: catchDispositionSchema.optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const {
        page,
        limit,
        search,
        fisherfolkId,
        gearType,
        barangay,
        dateFrom,
        dateTo,
        disposition,
      } = input;
      const skip = (page - 1) * limit;

      const where: Prisma.FishCatchWhereInput = {
        tenantId: ctx.tenantId,
        ...(fisherfolkId && { fisherfolkId }),
        ...(gearType && { gearType }),
        ...(barangay && { fishingGroundBarangay: barangay }),
        ...(disposition && { disposition }),
        ...((dateFrom || dateTo) && {
          landingDate: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) }),
          },
        }),
        ...(search && {
          OR: [
            { referenceNo: { contains: search, mode: "insensitive" as const } },
            {
              fishingGroundLabel: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              fisherfolk: {
                OR: [
                  {
                    firstName: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    lastName: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              },
            },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.fishCatch.findMany({
          where,
          skip,
          take: limit,
          orderBy: { landingDate: "desc" },
          select: {
            id: true,
            referenceNo: true,
            landingDate: true,
            gearType: true,
            totalCatchKg: true,
            disposition: true,
            fishingGroundBarangay: true,
            fishingGroundLabel: true,
            numTrips: true,
            fisherfolk: { select: fisherfolkSelect },
            vessel: { select: vesselSelect },
            _count: { select: { species: true } },
          },
        }),
        ctx.db.fishCatch.count({ where }),
      ]);

      return {
        items: items.map((item) => ({
          ...item,
          totalCatchKg: decToNumRequired(item.totalCatchKg),
        })),
        total,
        page,
        limit,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const record = await ctx.db.fishCatch.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          fisherfolk: { select: fisherfolkSelect },
          vessel: { select: vesselSelect },
          species: true,
          recordedBy: { select: { id: true, name: true } },
        },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        ...record,
        totalCatchKg: decToNumRequired(record.totalCatchKg),
        estimatedValuePhp: decToNum(record.estimatedValuePhp),
        fishingHours: decToNum(record.fishingHours),
        species: record.species.map((s) => ({
          ...s,
          weightKg: decToNumRequired(s.weightKg),
          pricePerKgPhp: decToNum(s.pricePerKgPhp),
          valuePhp: decToNum(s.valuePhp),
          avgLengthCm: decToNum(s.avgLengthCm),
        })),
      };
    }),

  create: adminProcedure
    .input(fishCatchCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;
      const { species, ...header } = input;

      const record = await ctx.db.$transaction(async (tx) => {
        const year = header.landingDate.getFullYear();
        const prefix = `FC-${year}-`;

        const last = await tx.fishCatch.findFirst({
          where: { tenantId, referenceNo: { startsWith: prefix } },
          orderBy: { referenceNo: "desc" },
          select: { referenceNo: true },
        });

        let nextSeq = 1;
        if (last) {
          const tail = last.referenceNo.slice(prefix.length);
          const parsed = Number.parseInt(tail, 10);
          if (Number.isFinite(parsed) && parsed > 0) nextSeq = parsed + 1;
        }
        const referenceNo = `${prefix}${nextSeq.toString().padStart(4, "0")}`;

        return tx.fishCatch.create({
          data: {
            ...omitUndefined(header),
            referenceNo,
            tenantId,
            createdById: userId,
            recordedById: userId,
            species: {
              create: species.map((s) => ({ ...omitUndefined(s), tenantId })),
            },
          },
          include: { species: true },
        });
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "CREATE",
          entityType: "FishCatch",
          entityId: record.id,
          after: toAuditJson(record),
        },
      });

      return {
        ...record,
        totalCatchKg: decToNumRequired(record.totalCatchKg),
        estimatedValuePhp: decToNum(record.estimatedValuePhp),
        fishingHours: decToNum(record.fishingHours),
        species: record.species.map((s) => ({
          ...s,
          weightKg: decToNumRequired(s.weightKg),
          pricePerKgPhp: decToNum(s.pricePerKgPhp),
          valuePhp: decToNum(s.valuePhp),
          avgLengthCm: decToNum(s.avgLengthCm),
        })),
      };
    }),

  update: adminProcedure
    .input(fishCatchUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;
      const { id, data } = input;
      const { species, ...headerData } = data;

      const existing = await ctx.db.fishCatch.findFirst({
        where: { id, tenantId },
        include: { species: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.$transaction(async (tx) => {
        await tx.fishCatch.update({
          where: { id },
          data: { ...omitUndefined(headerData), updatedById: userId },
        });

        if (species !== undefined) {
          await tx.fishCatchSpecies.deleteMany({
            where: { fishCatchId: id },
          });
          await tx.fishCatchSpecies.createMany({
            data: species.map((s) => ({
              ...omitUndefined(s),
              fishCatchId: id,
              tenantId,
            })),
          });
        }

        return tx.fishCatch.findFirstOrThrow({
          where: { id, tenantId },
          include: { species: true },
        });
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "UPDATE",
          entityType: "FishCatch",
          entityId: id,
          before: toAuditJson(existing),
          after: toAuditJson(updated),
        },
      });

      return {
        ...updated,
        totalCatchKg: decToNumRequired(updated.totalCatchKg),
        estimatedValuePhp: decToNum(updated.estimatedValuePhp),
        fishingHours: decToNum(updated.fishingHours),
        species: updated.species.map((s) => ({
          ...s,
          weightKg: decToNumRequired(s.weightKg),
          pricePerKgPhp: decToNum(s.pricePerKgPhp),
          valuePhp: decToNum(s.valuePhp),
          avgLengthCm: decToNum(s.avgLengthCm),
        })),
      };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;

      const existing = await ctx.db.fishCatch.findFirst({
        where: { id: input.id, tenantId },
        include: { species: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.fishCatch.delete({ where: { id: input.id } });

      await ctx.db.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "DELETE",
          entityType: "FishCatch",
          entityId: input.id,
          before: toAuditJson(existing),
        },
      });

      return { ok: true };
    }),

  stats: protectedProcedure
    .input(
      z
        .object({
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { dateFrom, dateTo } = input;

      const where: Prisma.FishCatchWhereInput = {
        tenantId: ctx.tenantId,
        ...((dateFrom || dateTo) && {
          landingDate: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) }),
          },
        }),
      };

      const [agg, fisherfolkGroups] = await Promise.all([
        ctx.db.fishCatch.aggregate({
          where,
          _count: { _all: true },
          _sum: { totalCatchKg: true },
        }),
        ctx.db.fishCatch.groupBy({
          by: ["fisherfolkId"],
          where,
        }),
      ]);

      return {
        totalRecords: agg._count._all,
        totalCatchKg: decToNum(agg._sum.totalCatchKg) ?? 0,
        activeFishers: fisherfolkGroups.length,
      };
    }),
});
