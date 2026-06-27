import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

function calcAge(dob: Date, now: Date): number {
  return Math.floor((now.getTime() - dob.getTime()) / MS_PER_YEAR);
}

type AgeBucket = "0-17" | "18-29" | "30-44" | "45-59" | "60+" | "Unknown";

const AGE_BUCKETS: AgeBucket[] = [
  "0-17",
  "18-29",
  "30-44",
  "45-59",
  "60+",
  "Unknown",
];

function ageBucket(dob: Date | null, now: Date): AgeBucket {
  if (!dob) return "Unknown";
  const age = calcAge(dob, now);
  if (age < 18) return "0-17";
  if (age < 30) return "18-29";
  if (age < 45) return "30-44";
  if (age < 60) return "45-59";
  return "60+";
}

export const analyticsRouter = createTRPCRouter({
  /**
   * Registration trend: count of fisherfolk per registrationYear, ascending.
   */
  getRegistrationTrends: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId: string = ctx.tenantId;

    const groups = await ctx.db.fisherfolk.groupBy({
      by: ["registrationYear"],
      where: { tenantId },
      _count: { _all: true },
      orderBy: { registrationYear: "asc" },
    });

    return groups.map(
      (g: { registrationYear: number; _count: { _all: number } }) => ({
        year: g.registrationYear,
        count: g._count._all,
      }),
    );
  }),

  /**
   * Voter eligibility: age >= 18 → eligible, < 18 → not eligible, no DOB → unknown.
   */
  getVoterAnalysis: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId: string = ctx.tenantId;

    const records = await ctx.db.fisherfolk.findMany({
      where: { tenantId },
      select: { dateOfBirth: true },
    });

    const now = new Date();
    let eligible = 0;
    let notEligible = 0;
    let unknown = 0;

    for (const f of records) {
      if (!f.dateOfBirth) {
        unknown++;
        continue;
      }
      const age = calcAge(new Date(f.dateOfBirth), now);
      if (age >= 18) eligible++;
      else notEligible++;
    }

    return { eligible, notEligible, unknown };
  }),

  /**
   * Seniors (age >= 60) per barangay, desc, top 15.
   */
  getSeniorsByBarangay: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId: string = ctx.tenantId;

    const records = await ctx.db.fisherfolk.findMany({
      where: { tenantId },
      select: { barangay: true, dateOfBirth: true },
    });

    const now = new Date();
    const tally = new Map<string, number>();

    for (const f of records) {
      if (!f.dateOfBirth) continue;
      const age = calcAge(new Date(f.dateOfBirth), now);
      if (age < 60) continue;
      tally.set(f.barangay, (tally.get(f.barangay) ?? 0) + 1);
    }

    return Array.from(tally.entries())
      .map(([barangay, count]) => ({ barangay, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }),

  /**
   * Active violation hotspots: barangay → count, desc, top 15.
   */
  getViolationHotspots: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId: string = ctx.tenantId;

    const violations = await ctx.db.violation.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: { fisherfolk: { select: { barangay: true } } },
    });

    const tally = new Map<string, number>();
    for (const v of violations) {
      const barangay = v.fisherfolk?.barangay;
      if (!barangay) continue;
      tally.set(barangay, (tally.get(barangay) ?? 0) + 1);
    }

    return Array.from(tally.entries())
      .map(([barangay, count]) => ({ barangay, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }),

  /**
   * Age pyramid: buckets × sex breakdown.
   */
  getAgePyramid: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId: string = ctx.tenantId;

    const records = await ctx.db.fisherfolk.findMany({
      where: { tenantId },
      select: { sex: true, dateOfBirth: true },
    });

    const now = new Date();
    const male: Record<AgeBucket, number> = {
      "0-17": 0,
      "18-29": 0,
      "30-44": 0,
      "45-59": 0,
      "60+": 0,
      Unknown: 0,
    };
    const female: Record<AgeBucket, number> = {
      "0-17": 0,
      "18-29": 0,
      "30-44": 0,
      "45-59": 0,
      "60+": 0,
      Unknown: 0,
    };

    for (const f of records) {
      const bucket = ageBucket(f.dateOfBirth ? new Date(f.dateOfBirth) : null, now);
      if (f.sex === "MALE") male[bucket]++;
      else if (f.sex === "FEMALE") female[bucket]++;
    }

    return AGE_BUCKETS.map((bucket) => ({
      bucket,
      male: male[bucket],
      female: female[bucket],
    }));
  }),
});
