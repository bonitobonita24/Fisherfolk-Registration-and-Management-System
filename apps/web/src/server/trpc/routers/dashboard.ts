import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { FisherfolkStatus } from "@frms/db";

import { createTRPCRouter, adminProcedure, protectedProcedure } from "../trpc";
import { resetAnnualRegistrations } from "../../lib/registration-lifecycle";

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure
    .input(z.object({ year: z.number().int().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const tenant = await ctx.db.tenant.findFirst({
        where: { id: ctx.tenantId },
        select: { currentRegistrationYear: true },
      });
      const year =
        input?.year ?? tenant?.currentRegistrationYear ?? new Date().getFullYear();

      const [
        totalFisherfolk,
        activeFisherfolk,
        totalVessels,
        activeViolations,
        missingPhoto,
        missingSignature,
        newFisherfolk,
        renewedFisherfolk,
      ] = await Promise.all([
        ctx.db.fisherfolk.count({ where: { tenantId: ctx.tenantId } }),
        ctx.db.fisherfolk.count({
          where: { tenantId: ctx.tenantId, status: "ACTIVE" },
        }),
        ctx.db.vessel.count({ where: { tenantId: ctx.tenantId } }),
        ctx.db.violation.count({
          where: { tenantId: ctx.tenantId, status: "ACTIVE" },
        }),
        ctx.db.fisherfolk.count({
          where: { tenantId: ctx.tenantId, photo: null },
        }),
        ctx.db.fisherfolk.count({
          where: { tenantId: ctx.tenantId, signature: null },
        }),
        ctx.db.fisherfolk.count({
          where: { tenantId: ctx.tenantId, status: "NEW", registrationYear: year },
        }),
        ctx.db.fisherfolk.count({
          where: { tenantId: ctx.tenantId, status: "RENEWED", registrationYear: year },
        }),
      ]);

      return {
        totalFisherfolk,
        activeFisherfolk,
        totalVessels,
        activeViolations,
        missingPhoto,
        missingSignature,
        newFisherfolk,
        renewedFisherfolk,
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

  // Per-barangay density + subgroup breakdown, for the dashboard's barangay
  // density map. Supports four datasets — fisherfolk (ACTIVE, by activity
  // category), and vessels / ayuda / violations whose geolocation is derived
  // through the fisherfolk relation (owner / beneficiary / violator barangay).
  // Returns a uniform { subgroups, barangays } shape the map renders directly.
  getBarangayDensity: protectedProcedure
    .input(
      z
        .object({
          dataset: z
            .enum(["fisherfolk", "vessels", "ayuda", "violations"])
            .default("fisherfolk"),
        })
        .default({ dataset: "fisherfolk" }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId: string = ctx.tenantId;

      // Cyclic palette for datasets whose subgroups carry no colour of their own.
      const PALETTE = [
        "#38bdf8",
        "#34d399",
        "#fbbf24",
        "#f472b6",
        "#a78bfa",
        "#f87171",
        "#22d3ee",
        "#a3e635",
      ];
      const paletteColor = (i: number): string =>
        PALETTE[i % PALETTE.length] ?? "#38bdf8";

      // Shared per-barangay aggregator. `total` counts each source record once;
      // `bySub` breaks it down by subgroup id (a record may still contribute to
      // multiple subgroups, e.g. a fisherfolk with several categories).
      type Entry = { total: number; bySub: Map<string, number> };
      const agg = new Map<string, Entry>();
      const ensure = (barangay: string): Entry => {
        let e = agg.get(barangay);
        if (e == null) {
          e = { total: 0, bySub: new Map<string, number>() };
          agg.set(barangay, e);
        }
        return e;
      };
      const bump = (e: Entry, subId: string): void => {
        e.bySub.set(subId, (e.bySub.get(subId) ?? 0) + 1);
      };

      let subgroups: { id: string; name: string; color: string }[] = [];

      if (input.dataset === "fisherfolk") {
        const cats = await ctx.db.category.findMany({
          where: { tenantId, status: "ACTIVE" },
          select: { id: true, name: true, displayColor: true },
          orderBy: { displayOrder: "asc" },
        });
        subgroups = cats.map(
          (c: { id: string; name: string; displayColor: string | null }) => ({
            id: c.id,
            name: c.name,
            color: c.displayColor ?? "#38bdf8",
          }),
        );

        const rows = await ctx.db.fisherfolk.findMany({
          where: { tenantId, status: "ACTIVE" },
          select: { barangay: true, categoryIds: true },
        });
        for (const r of rows) {
          const e = ensure(r.barangay);
          e.total += 1;
          for (const categoryId of r.categoryIds) bump(e, categoryId);
        }
      } else if (input.dataset === "vessels") {
        const vessels = await ctx.db.vessel.findMany({
          where: { tenantId },
          select: {
            vesselType: true,
            owners: { select: { barangay: true } },
          },
        });
        const types = new Set<string>();
        for (const v of vessels) {
          const barangays = new Set(
            v.owners
              .map((o: { barangay: string }) => o.barangay)
              .filter((b: string) => b != null && b !== ""),
          );
          if (barangays.size === 0) continue; // no owner/barangay → skip
          types.add(v.vesselType);
          for (const barangay of barangays) {
            const e = ensure(barangay);
            e.total += 1;
            bump(e, v.vesselType);
          }
        }
        subgroups = Array.from(types)
          .sort()
          .map((t, i) => ({ id: t, name: t, color: paletteColor(i) }));
      } else if (input.dataset === "ayuda") {
        const programs = await ctx.db.ayudaProgram.findMany({
          where: { tenantId },
          select: { id: true, title: true },
          orderBy: { createdAt: "asc" },
        });
        subgroups = programs.map(
          (p: { id: string; title: string }, i: number) => ({
            id: p.id,
            name: p.title,
            color: paletteColor(i),
          }),
        );

        const beneficiaries = await ctx.db.ayudaBeneficiary.findMany({
          where: { tenantId },
          select: {
            programId: true,
            fisherfolk: { select: { barangay: true } },
          },
        });
        for (const b of beneficiaries) {
          const barangay = b.fisherfolk?.barangay;
          if (barangay == null || barangay === "") continue;
          const e = ensure(barangay);
          e.total += 1;
          bump(e, b.programId);
        }
      } else {
        // violations — grouped by status (no discrete violation-type field);
        // only violations linked to a fisherfolk carry a barangay.
        const violations = await ctx.db.violation.findMany({
          where: { tenantId, fisherfolkId: { not: null } },
          select: {
            status: true,
            fisherfolk: { select: { barangay: true } },
          },
        });
        const statuses = new Set<string>();
        for (const v of violations) {
          const barangay = v.fisherfolk?.barangay;
          if (barangay == null || barangay === "") continue;
          statuses.add(v.status);
          const e = ensure(barangay);
          e.total += 1;
          bump(e, v.status);
        }
        subgroups = Array.from(statuses)
          .sort()
          .map((s, i) => ({ id: s, name: s, color: paletteColor(i) }));
      }

      const barangays = Array.from(agg.entries()).map(([barangay, e]) => ({
        barangay,
        total: e.total,
        bySubgroup: Array.from(e.bySub.entries()).map(([id, count]) => ({
          id,
          count,
        })),
      }));

      return { subgroups, barangays };
    }),

  // Admin-only mutation: bulk-reset ACTIVE/RENEWED fisherfolk from prior years
  // to INACTIVE. Idempotent. Called manually by admin; helper path is reusable
  // by a future cron.
  resetAnnualRegistrations: adminProcedure.mutation(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenant = await ctx.db.tenant.findFirst({
      where: { id: ctx.tenantId },
      select: { currentRegistrationYear: true },
    });
    if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });
    const result = await resetAnnualRegistrations(
      ctx.db,
      ctx.tenantId,
      tenant.currentRegistrationYear,
    );
    return result;
  }),

  // Per-Category fisherfolk counts filtered by registration type + year.
  getFisherfolkCategoryBreakdown: protectedProcedure
    .input(
      z.object({
        registrationType: z.enum(["ALL", "NEW", "RENEWED"]),
        year: z.number().int().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId: string = ctx.tenantId;

      const tenant = await ctx.db.tenant.findFirst({
        where: { id: tenantId },
        select: { currentRegistrationYear: true },
      });
      const year =
        input.year ?? tenant?.currentRegistrationYear ?? new Date().getFullYear();

      const statusFilter =
        input.registrationType === "ALL"
          ? { status: { in: ["NEW", "RENEWED", "ACTIVE"] as FisherfolkStatus[] } }
          : { status: input.registrationType };

      const cats = await ctx.db.category.findMany({
        where: { tenantId },
        select: { id: true, name: true },
      });

      const counts = await Promise.all(
        cats.map((c: { id: string; name: string }) =>
          ctx.db.fisherfolk.count({
            where: {
              tenantId,
              ...statusFilter,
              registrationYear: year,
              categoryIds: { has: c.id },
            },
          }),
        ),
      );

      return cats.map((c: { id: string; name: string }, i: number) => ({
        category: c.name,
        count: counts[i] ?? 0,
      }));
    }),

  // Per-vesselType counts. Groups by vesselType (D3: vessel has no registrationYear).
  getVesselCategoryBreakdown: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId: string = ctx.tenantId;

      const groups = await ctx.db.vessel.groupBy({
        by: ["vesselType"],
        where: { tenantId },
        _count: { _all: true },
      });

      return groups.map((g: { vesselType: string; _count: { _all: number } }) => ({
        vesselType: g.vesselType,
        count: g._count._all,
      }));
    }),

  // Per-AyudaProgram beneficiary counts (tenant-scoped). Mirrors
  // getVesselCategoryBreakdown's style for the dashboard breakdown charts.
  getAyudaProgramBreakdown: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId: string = ctx.tenantId;

    const programs = await ctx.db.ayudaProgram.findMany({
      where: { tenantId },
      select: {
        title: true,
        _count: { select: { beneficiaries: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return programs.map(
      (p: { title: string; _count: { beneficiaries: number } }) => ({
        program: p.title,
        count: p._count.beneficiaries,
      }),
    );
  }),

  // Per-status violation counts (tenant-scoped). Violations have no discrete
  // "type" field, so status is the grouping dimension.
  getViolationBreakdown: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId: string = ctx.tenantId;

    const groups = await ctx.db.violation.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { _all: true },
    });

    return groups.map((g: { status: string; _count: { _all: number } }) => ({
      type: g.status,
      count: g._count._all,
    }));
  }),

  // Household counts (tenant-scoped): total, by barangay, and by the head's
  // activity category. `byCategory` mirrors getDemographics/getCategoryByBarangay's
  // convention — a household is counted once per category the HEAD belongs to
  // (not deduplicated across a head's multiple categoryIds), matching how
  // fisherfolk-by-category stats already treat multi-category members.
  getHouseholdStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId: string = ctx.tenantId;

    const [total, barangayGroups, cats] = await Promise.all([
      ctx.db.household.count({ where: { tenantId } }),
      ctx.db.household.groupBy({
        by: ["barangay"],
        where: { tenantId },
        _count: { _all: true },
        orderBy: { _count: { barangay: "desc" } },
      }),
      ctx.db.category.findMany({
        where: { tenantId },
        select: { id: true, name: true },
      }),
    ]);

    const categoryCounts = await Promise.all(
      cats.map((c: { id: string; name: string }) =>
        ctx.db.household.count({
          where: { tenantId, head: { categoryIds: { has: c.id } } },
        }),
      ),
    );

    return {
      total,
      byBarangay: barangayGroups.map(
        (g: { barangay: string; _count: { _all: number } }) => ({
          barangay: g.barangay,
          count: g._count._all,
        }),
      ),
      byCategory: cats.map((c: { id: string; name: string }, i: number) => ({
        category: c.name,
        count: categoryCounts[i] ?? 0,
      })),
    };
  }),
});
