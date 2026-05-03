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
});
