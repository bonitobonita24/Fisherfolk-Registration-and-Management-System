import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Prisma } from "@frms/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Prisma `Decimal` fields serialize to opaque objects over the wire.
 * Convert to a plain number before returning to the client.
 * (Copied verbatim from routers/fishCatch.ts.)
 */
function decToNum<T>(value: T): number | null {
  if (value === null || value === undefined) return null;
  const v = value as unknown as { toNumber?: () => number };
  return typeof v.toNumber === "function" ? v.toNumber() : Number(value);
}

const dateRangeInput = z
  .object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    topN: z.number().int().positive().optional(),
  })
  .strict();

function buildWhere(
  tenantId: string,
  dateFrom: string | undefined,
  dateTo: string | undefined,
): Prisma.FishCatchWhereInput {
  return {
    tenantId,
    ...((dateFrom || dateTo) && {
      landingDate: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      },
    }),
  };
}

export const fishCatchAnalyticsRouter = createTRPCRouter({
  /**
   * Monthly catch trend: totalKg / value / trips / hours + derived CPUE.
   */
  catchTrends: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const where = buildWhere(tenantId, input.dateFrom, input.dateTo);

      const records = await ctx.db.fishCatch.findMany({
        where,
        select: {
          landingDate: true,
          totalCatchKg: true,
          fishingHours: true,
          estimatedValuePhp: true,
        },
      });

      const tally = new Map<
        string,
        { totalKg: number; valuePhp: number; trips: number; hours: number }
      >();

      for (const r of records) {
        const d = new Date(r.landingDate);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const entry = tally.get(month) ?? {
          totalKg: 0,
          valuePhp: 0,
          trips: 0,
          hours: 0,
        };
        entry.totalKg += decToNum(r.totalCatchKg) ?? 0;
        entry.valuePhp += decToNum(r.estimatedValuePhp) ?? 0;
        entry.trips += 1;
        entry.hours += decToNum(r.fishingHours) ?? 0;
        tally.set(month, entry);
      }

      return Array.from(tally.entries())
        .map(([month, v]) => ({
          month,
          totalKg: v.totalKg,
          valuePhp: v.valuePhp,
          trips: v.trips,
          hours: v.hours,
          cpueHr: v.hours > 0 ? v.totalKg / v.hours : 0,
          cpueTrip: v.trips > 0 ? v.totalKg / v.trips : 0,
        }))
        .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
    }),

  /**
   * Top species by catch weight (default top 10).
   */
  bySpecies: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const { dateFrom, dateTo, topN } = input;

      const groups = await ctx.db.fishCatchSpecies.groupBy({
        by: ["commonName"],
        where: {
          tenantId,
          ...((dateFrom || dateTo) && {
            fishCatch: {
              landingDate: {
                ...(dateFrom && { gte: new Date(dateFrom) }),
                ...(dateTo && { lte: new Date(dateTo) }),
              },
            },
          }),
        },
        _sum: { weightKg: true, valuePhp: true },
      });

      return groups
        .map((g) => ({
          commonName: g.commonName,
          totalKg: decToNum(g._sum.weightKg) ?? 0,
          valuePhp: decToNum(g._sum.valuePhp) ?? 0,
        }))
        .sort((a, b) => b.totalKg - a.totalKg)
        .slice(0, topN ?? 10);
    }),

  /**
   * Catch + effort breakdown by gear type.
   */
  byGearType: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const where = buildWhere(tenantId, input.dateFrom, input.dateTo);

      const groups = await ctx.db.fishCatch.groupBy({
        by: ["gearType"],
        where,
        _sum: { totalCatchKg: true, fishingHours: true },
        _count: { _all: true },
      });

      return groups.map((g) => {
        const totalKg = decToNum(g._sum.totalCatchKg) ?? 0;
        const hours = decToNum(g._sum.fishingHours) ?? 0;
        return {
          gearType: g.gearType,
          totalKg,
          hours,
          trips: g._count._all,
          cpueHr: hours > 0 ? totalKg / hours : 0,
        };
      });
    }),

  /**
   * Catch + trip breakdown by fishing-ground barangay (top 15).
   */
  byBarangay: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const where = buildWhere(tenantId, input.dateFrom, input.dateTo);

      const groups = await ctx.db.fishCatch.groupBy({
        by: ["fishingGroundBarangay"],
        where: { ...where, fishingGroundBarangay: { not: null } },
        _sum: { totalCatchKg: true },
        _count: { _all: true },
      });

      return groups
        .map((g) => ({
          barangay: g.fishingGroundBarangay as string,
          totalKg: decToNum(g._sum.totalCatchKg) ?? 0,
          trips: g._count._all,
        }))
        .sort((a, b) => b.totalKg - a.totalKg)
        .slice(0, 15);
    }),

  /**
   * Top fishers by total catch weight (default top 10).
   */
  topFishers: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const { dateFrom, dateTo, topN } = input;
      const where = buildWhere(tenantId, dateFrom, dateTo);

      const groups = await ctx.db.fishCatch.groupBy({
        by: ["fisherfolkId"],
        where,
        _sum: { totalCatchKg: true },
      });

      const top = groups
        .map((g) => ({
          fisherfolkId: g.fisherfolkId,
          totalKg: decToNum(g._sum.totalCatchKg) ?? 0,
        }))
        .sort((a, b) => b.totalKg - a.totalKg)
        .slice(0, topN ?? 10);

      const fisherfolk = await ctx.db.fisherfolk.findMany({
        where: { id: { in: top.map((t) => t.fisherfolkId) }, tenantId },
        select: { id: true, firstName: true, lastName: true },
      });
      const nameById = new Map(
        fisherfolk.map((f) => [f.id, `${f.firstName} ${f.lastName}`]),
      );

      return top.map((t) => ({
        fisherfolkId: t.fisherfolkId,
        name: nameById.get(t.fisherfolkId) ?? "Unknown",
        totalKg: t.totalKg,
      }));
    }),

  /**
   * Top vessels by total catch weight (default top 10).
   */
  topVessels: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const { dateFrom, dateTo, topN } = input;
      const where = buildWhere(tenantId, dateFrom, dateTo);

      const groups = await ctx.db.fishCatch.groupBy({
        by: ["vesselId"],
        where: { ...where, vesselId: { not: null } },
        _sum: { totalCatchKg: true },
      });

      const top = groups
        .map((g) => ({
          vesselId: g.vesselId as string,
          totalKg: decToNum(g._sum.totalCatchKg) ?? 0,
        }))
        .sort((a, b) => b.totalKg - a.totalKg)
        .slice(0, topN ?? 10);

      const vessels = await ctx.db.vessel.findMany({
        where: { id: { in: top.map((t) => t.vesselId) }, tenantId },
        select: { id: true, vesselName: true, mfvrNumber: true },
      });
      const nameById = new Map(
        vessels.map((v) => [v.id, v.vesselName ?? v.mfvrNumber]),
      );

      return top.map((t) => ({
        vesselId: t.vesselId,
        name: nameById.get(t.vesselId) ?? "Unknown",
        totalKg: t.totalKg,
      }));
    }),
});
