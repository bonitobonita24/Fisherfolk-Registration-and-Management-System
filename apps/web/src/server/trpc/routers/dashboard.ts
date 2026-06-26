import { TRPCError } from "@trpc/server";

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
    ]);

    return {
      totalFisherfolk,
      activeFisherfolk,
      totalVessels,
      activeViolations,
      totalUsers,
      pendingEditRequests,
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
});
