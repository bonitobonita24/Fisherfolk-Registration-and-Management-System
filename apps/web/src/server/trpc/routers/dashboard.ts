import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

    const [
      totalFisherfolk,
      activeFisherfolk,
      totalVessels,
      activeViolations,
      totalUsers,
      pendingEditRequests,
      missingPhoto,
      missingSignature,
    ] = await Promise.all([
      ctx.db.fisherfolk.count({ where: { tenantId: ctx.tenantId } }),
      ctx.db.fisherfolk.count({
        where: { tenantId: ctx.tenantId, status: "ACTIVE" },
      }),
      ctx.db.vessel.count({ where: { tenantId: ctx.tenantId } }),
      ctx.db.violation.count({
        where: { tenantId: ctx.tenantId, status: "ACTIVE" },
      }),
      ctx.db.user.count({
        where: { tenantId: ctx.tenantId, status: "ACTIVE" },
      }),
      ctx.db.editRequest.count({
        where: { tenantId: ctx.tenantId, status: "PENDING" },
      }),
      ctx.db.fisherfolk.count({
        where: { tenantId: ctx.tenantId, photo: null },
      }),
      ctx.db.fisherfolk.count({
        where: { tenantId: ctx.tenantId, signature: null },
      }),
    ]);

    return {
      totalFisherfolk,
      activeFisherfolk,
      totalVessels,
      activeViolations,
      totalUsers,
      pendingEditRequests,
      missingPhoto,
      missingSignature,
    };
  }),

  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

    const [recentFisherfolk, recentViolations, recentAuditLogs] =
      await Promise.all([
        ctx.db.fisherfolk.findMany({
          where: { tenantId: ctx.tenantId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            fullName: true,
            idNumber: true,
            createdAt: true,
          },
        }),
        ctx.db.violation.findMany({
          where: { tenantId: ctx.tenantId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            subject: true,
            status: true,
            createdAt: true,
            fisherfolk: { select: { id: true, fullName: true } },
          },
        }),
        ctx.db.auditLog.findMany({
          where: { tenantId: ctx.tenantId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            createdAt: true,
            user: { select: { id: true, name: true } },
          },
        }),
      ]);

    return { recentFisherfolk, recentViolations, recentAuditLogs };
  }),

  getFisherfolkByBarangay: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

    const groups = await ctx.db.fisherfolk.groupBy({
      by: ["barangay"],
      where: { tenantId: ctx.tenantId, status: "ACTIVE" },
      _count: { _all: true },
      orderBy: { _count: { barangay: "desc" } },
    });

    return groups.map((g: { barangay: string; _count: { _all: number } }) => ({
      barangay: g.barangay,
      count: g._count._all,
    }));
  }),

  getDemographics: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    // Capture narrowed tenantId so closures (e.g. .map callbacks) keep the
    // `string` type — TypeScript can lose narrowing across closure boundaries.
    const tenantId: string = ctx.tenantId;

    // Sex breakdown
    const [maleCt, femaleCt, totalCt] = await Promise.all([
      ctx.db.fisherfolk.count({
        where: { tenantId, sex: "MALE" },
      }),
      ctx.db.fisherfolk.count({
        where: { tenantId, sex: "FEMALE" },
      }),
      ctx.db.fisherfolk.count({ where: { tenantId } }),
    ]);
    const unspecified = totalCt - maleCt - femaleCt;

    // Status breakdown
    const statusGroups = await ctx.db.fisherfolk.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { _all: true },
    });

    // Category breakdown — fetch categories then count fisherfolk per category
    const cats = await ctx.db.category.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const categoryCounts = await Promise.all(
      cats.map((c: { id: string; name: string }) =>
        ctx.db.fisherfolk.count({
          where: { tenantId, categoryIds: { has: c.id } },
        }),
      ),
    );

    // Age buckets — fetch dateOfBirth, bucket in JS
    const fisherfolkDates = await ctx.db.fisherfolk.findMany({
      where: { tenantId },
      select: { dateOfBirth: true },
    });

    const now = new Date();
    const ageBuckets = { unknown: 0, senior: 0, adult: 0, minor: 0 };
    for (const f of fisherfolkDates) {
      if (!f.dateOfBirth) {
        ageBuckets.unknown++;
        continue;
      }
      const dob = new Date(f.dateOfBirth);
      const age = Math.floor(
        (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
      );
      if (age >= 60) ageBuckets.senior++;
      else if (age < 18) ageBuckets.minor++;
      else ageBuckets.adult++;
    }

    return {
      sex: { male: maleCt, female: femaleCt, unspecified },
      status: statusGroups.map(
        (g: { status: string; _count: { _all: number } }) => ({
          status: g.status,
          count: g._count._all,
        }),
      ),
      categories: cats.map((c: { id: string; name: string }, i: number) => ({
        name: c.name,
        count: categoryCounts[i] ?? 0,
      })),
      ageBuckets,
    };
  }),

  // Fine-grained 6-bucket age distribution (mirrors the legacy FMO dashboard:
  // Under 25 / 25-34 / 35-44 / 45-54 / 55-64 / 65+). Unknown DOB excluded.
  getAgeGroups: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId: string = ctx.tenantId;

    const rows = await ctx.db.fisherfolk.findMany({
      where: { tenantId },
      select: { dateOfBirth: true },
    });

    const buckets = [
      { group: "Under 25", min: 0, max: 24 },
      { group: "25-34", min: 25, max: 34 },
      { group: "35-44", min: 35, max: 44 },
      { group: "45-54", min: 45, max: 54 },
      { group: "55-64", min: 55, max: 64 },
      { group: "65+", min: 65, max: 200 },
    ] as const;
    const counts = buckets.map(() => 0);

    const now = Date.now();
    for (const r of rows) {
      if (!r.dateOfBirth) continue;
      const age = Math.floor(
        (now - new Date(r.dateOfBirth).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      );
      const idx = buckets.findIndex((b) => age >= b.min && age <= b.max);
      if (idx >= 0) counts[idx] = (counts[idx] ?? 0) + 1;
    }

    return buckets.map((b, i) => ({ group: b.group, count: counts[i] ?? 0 }));
  }),

  // Activity-category breakdown, optionally scoped to a single barangay.
  // Powers the dashboard's barangay-filtered category chart.
  getCategoryByBarangay: protectedProcedure
    .input(z.object({ barangay: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId: string = ctx.tenantId;

      const barangay = input?.barangay;
      const scope =
        barangay && barangay !== "all" ? { barangay } : {};

      const cats = await ctx.db.category.findMany({
        where: { tenantId },
        select: { id: true, name: true },
      });

      const counts = await Promise.all(
        cats.map((c: { id: string; name: string }) =>
          ctx.db.fisherfolk.count({
            where: { tenantId, ...scope, categoryIds: { has: c.id } },
          }),
        ),
      );

      return cats.map((c: { id: string; name: string }, i: number) => ({
        category: c.name,
        count: counts[i] ?? 0,
      }));
    }),

  // Per-barangay fisherfolk density + activity-category breakdown, for the
  // dashboard's barangay density map. ACTIVE-only, mirroring
  // getFisherfolkByBarangay/getCategoryByBarangay for consistency.
  getBarangayDensity: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId: string = ctx.tenantId;

    const rows = await ctx.db.fisherfolk.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: { barangay: true, categoryIds: true },
    });

    const byBarangay = new Map<
      string,
      { total: number; byCategory: Map<string, number> }
    >();

    for (const r of rows) {
      let entry = byBarangay.get(r.barangay);
      if (entry == null) {
        entry = { total: 0, byCategory: new Map<string, number>() };
        byBarangay.set(r.barangay, entry);
      }
      entry.total += 1;
      for (const categoryId of r.categoryIds) {
        entry.byCategory.set(
          categoryId,
          (entry.byCategory.get(categoryId) ?? 0) + 1,
        );
      }
    }

    return Array.from(byBarangay.entries()).map(([barangay, entry]) => ({
      barangay,
      total: entry.total,
      byCategory: Array.from(entry.byCategory.entries()).map(
        ([categoryId, count]) => ({ categoryId, count }),
      ),
    }));
  }),
});
