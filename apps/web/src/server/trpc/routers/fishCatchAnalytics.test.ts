/**
 * Integration tests — fishCatchAnalytics tRPC router
 * (catchTrends / bySpecies / byGearType / byBarangay / topFishers / topVessels
 *  + tenant isolation + Decimal-leakage checks)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/fishCatchAnalytics.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — protectedProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../context";
import { fishCatchAnalyticsRouter } from "./fishCatchAnalytics";
import { createCallerFactory } from "../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG_A = `fca-test-a-${RUN}`;
const SLUG_B = `fca-test-b-${RUN}`;

const YEAR = new Date().getFullYear();

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantAId: string;
let testTenantBId: string;
let testUserId: string;
let testUserBId: string;

let ffOneId: string;
let ffTwoId: string;
let vesselOneId: string;
let vesselTwoId: string;

let ffBId: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(tenantId: string, userId: string): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Test Admin", email: "admin@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId,
    role: "admin",
    tenantId,
    tenantSlug: SLUG_A,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(fishCatchAnalyticsRouter);
const caller = (tenantId: string, userId: string = testUserId) =>
  callerFactory(makeCtx(tenantId, userId));

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  for (const slug of [SLUG_A, SLUG_B]) {
    const existing = await platformPrisma.tenant.findUnique({
      where: { slug },
    });
    if (existing) {
      await platformPrisma.fishCatchSpecies.deleteMany({
        where: { tenantId: existing.id },
      });
      await platformPrisma.fishCatch.deleteMany({
        where: { tenantId: existing.id },
      });
      await platformPrisma.vessel.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.fisherfolk.deleteMany({
        where: { tenantId: existing.id },
      });
      await platformPrisma.auditLog.deleteMany({
        where: { tenantId: existing.id },
      });
      await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.tenant.delete({ where: { id: existing.id } });
    }
  }

  const tenantA = await platformPrisma.tenant.create({
    data: {
      name: "FCA Test Tenant A",
      slug: SLUG_A,
      status: "ACTIVE",
      currentRegistrationYear: YEAR,
    },
  });
  testTenantAId = tenantA.id;

  const tenantB = await platformPrisma.tenant.create({
    data: {
      name: "FCA Test Tenant B",
      slug: SLUG_B,
      status: "ACTIVE",
      currentRegistrationYear: YEAR,
    },
  });
  testTenantBId = tenantB.id;

  const user = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `fca-admin-${RUN}@local`,
      username: `fca-admin-${RUN}`,
      passwordHash: "not-real",
      name: "Test Admin",
      role: "admin",
    },
  });
  testUserId = user.id;

  const userB = await platformPrisma.user.create({
    data: {
      tenantId: testTenantBId,
      email: `fca-admin-b-${RUN}@local`,
      username: `fca-admin-b-${RUN}`,
      passwordHash: "not-real",
      name: "Test Admin B",
      role: "admin",
    },
  });
  testUserBId = userB.id;

  // ── Tenant A fixtures ──────────────────────────────────────────────────────

  const ffOne = await platformPrisma.fisherfolk.create({
    data: {
      tenantId: testTenantAId,
      idNumber: `FCAFF-${RUN}-1`,
      fullName: `FCAFisher${RUN} One`,
      lastName: "One",
      firstName: "Fisher",
      address: "1 Test St",
      barangay: "Barangay Test",
      categoryIds: [],
      registrationYear: YEAR,
      createdById: testUserId,
      updatedById: testUserId,
    },
  });
  ffOneId = ffOne.id;

  const ffTwo = await platformPrisma.fisherfolk.create({
    data: {
      tenantId: testTenantAId,
      idNumber: `FCAFF-${RUN}-2`,
      fullName: `FCAFisher${RUN} Two`,
      lastName: "Two",
      firstName: "Fisher",
      address: "2 Test St",
      barangay: "Barangay Test",
      categoryIds: [],
      registrationYear: YEAR,
      createdById: testUserId,
      updatedById: testUserId,
    },
  });
  ffTwoId = ffTwo.id;

  const vesselOne = await platformPrisma.vessel.create({
    data: {
      tenantId: testTenantAId,
      mfvrNumber: `FCAV-${RUN}-1`,
      vesselName: "Vessel One",
      vesselType: "Banca",
      createdById: testUserId,
      updatedById: testUserId,
    },
  });
  vesselOneId = vesselOne.id;

  const vesselTwo = await platformPrisma.vessel.create({
    data: {
      tenantId: testTenantAId,
      mfvrNumber: `FCAV-${RUN}-2`,
      vesselName: "Vessel Two",
      vesselType: "Banca",
      createdById: testUserId,
      updatedById: testUserId,
    },
  });
  vesselTwoId = vesselTwo.id;

  // 3 FishCatch rows across 2 months, 2 gear types, 2 barangays.

  // Row 1: Jan, HOOK_AND_LINE, Barangay One, ffOne, vesselOne. 10kg over 5hrs.
  const catch1 = await platformPrisma.fishCatch.create({
    data: {
      tenantId: testTenantAId,
      referenceNo: `FCA-${YEAR}-0001`,
      fisherfolkId: ffOneId,
      vesselId: vesselOneId,
      landingDate: new Date(`${YEAR}-01-10`),
      fishingGroundBarangay: "Barangay One",
      gearType: "HOOK_AND_LINE",
      fishingHours: 5,
      totalCatchKg: 10,
      estimatedValuePhp: 1000,
      createdById: testUserId,
      updatedById: testUserId,
    },
  });
  await platformPrisma.fishCatchSpecies.createMany({
    data: [
      {
        tenantId: testTenantAId,
        fishCatchId: catch1.id,
        commonName: "Bangus",
        weightKg: 6,
        valuePhp: 600,
      },
      {
        tenantId: testTenantAId,
        fishCatchId: catch1.id,
        commonName: "Tilapia",
        weightKg: 4,
        valuePhp: 400,
      },
    ],
  });

  // Row 2: Jan, GILL_NET, Barangay Two, ffTwo, vesselTwo. 20kg over 4hrs.
  const catch2 = await platformPrisma.fishCatch.create({
    data: {
      tenantId: testTenantAId,
      referenceNo: `FCA-${YEAR}-0002`,
      fisherfolkId: ffTwoId,
      vesselId: vesselTwoId,
      landingDate: new Date(`${YEAR}-01-20`),
      fishingGroundBarangay: "Barangay Two",
      gearType: "GILL_NET",
      fishingHours: 4,
      totalCatchKg: 20,
      estimatedValuePhp: 3000,
      createdById: testUserId,
      updatedById: testUserId,
    },
  });
  await platformPrisma.fishCatchSpecies.createMany({
    data: [
      {
        tenantId: testTenantAId,
        fishCatchId: catch2.id,
        commonName: "Bangus",
        weightKg: 14,
        valuePhp: 2000,
      },
      {
        tenantId: testTenantAId,
        fishCatchId: catch2.id,
        commonName: "Galunggong",
        weightKg: 6,
        valuePhp: 1000,
      },
    ],
  });

  // Row 3: Feb, HOOK_AND_LINE, Barangay One, ffOne, no vessel. 5kg over 1hr.
  const catch3 = await platformPrisma.fishCatch.create({
    data: {
      tenantId: testTenantAId,
      referenceNo: `FCA-${YEAR}-0003`,
      fisherfolkId: ffOneId,
      landingDate: new Date(`${YEAR}-02-05`),
      fishingGroundBarangay: "Barangay One",
      gearType: "HOOK_AND_LINE",
      fishingHours: 1,
      totalCatchKg: 5,
      estimatedValuePhp: 500,
      createdById: testUserId,
      updatedById: testUserId,
    },
  });
  await platformPrisma.fishCatchSpecies.createMany({
    data: [
      {
        tenantId: testTenantAId,
        fishCatchId: catch3.id,
        commonName: "Tilapia",
        weightKg: 5,
        valuePhp: 500,
      },
    ],
  });

  // ── Tenant B fixtures (isolation check) ────────────────────────────────────

  const ffB = await platformPrisma.fisherfolk.create({
    data: {
      tenantId: testTenantBId,
      idNumber: `FCAFF-${RUN}-B1`,
      fullName: `FCAFisher${RUN} B-One`,
      lastName: "BOne",
      firstName: "Fisher",
      address: "1 Test St",
      barangay: "Barangay B",
      categoryIds: [],
      registrationYear: YEAR,
      createdById: testUserBId,
      updatedById: testUserBId,
    },
  });
  ffBId = ffB.id;

  const catchB = await platformPrisma.fishCatch.create({
    data: {
      tenantId: testTenantBId,
      referenceNo: `FCA-${YEAR}-B001`,
      fisherfolkId: ffBId,
      landingDate: new Date(`${YEAR}-01-15`),
      fishingGroundBarangay: "Barangay B",
      gearType: "LONGLINE",
      fishingHours: 3,
      totalCatchKg: 9,
      estimatedValuePhp: 900,
      createdById: testUserBId,
      updatedById: testUserBId,
    },
  });
  await platformPrisma.fishCatchSpecies.createMany({
    data: [
      {
        tenantId: testTenantBId,
        fishCatchId: catchB.id,
        commonName: "Tuna",
        weightKg: 9,
        valuePhp: 900,
      },
    ],
  });
});

afterAll(async () => {
  if (!hasDb) return;

  for (const tenantId of [testTenantAId, testTenantBId]) {
    if (!tenantId) continue;
    await platformPrisma.fishCatchSpecies.deleteMany({ where: { tenantId } });
    await platformPrisma.fishCatch.deleteMany({ where: { tenantId } });
    await platformPrisma.vessel.deleteMany({ where: { tenantId } });
    await platformPrisma.fisherfolk.deleteMany({ where: { tenantId } });
    await platformPrisma.auditLog.deleteMany({ where: { tenantId } });
    await platformPrisma.user.deleteMany({ where: { tenantId } });
    await platformPrisma.tenant
      .delete({ where: { id: tenantId } })
      .catch(() => {
        /* already gone */
      });
  }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("fishCatchAnalytics.catchTrends", () => {
  it("buckets by month with correct totals and CPUE, no Decimal leakage", async () => {
    const trends = await caller(testTenantAId).catchTrends({});

    expect(trends).toHaveLength(2);

    const jan = trends.find((t) => t.month === `${YEAR}-01`);
    const feb = trends.find((t) => t.month === `${YEAR}-02`);
    expect(jan).toBeDefined();
    expect(feb).toBeDefined();

    // Jan: catch1 (10kg/5hr) + catch2 (20kg/4hr) => 30kg / 9hr
    expect(jan!.totalKg).toBe(30);
    expect(jan!.hours).toBe(9);
    expect(jan!.trips).toBe(2);
    expect(jan!.cpueHr).toBeCloseTo(30 / 9, 6);

    // Feb: catch3 (5kg/1hr)
    expect(feb!.totalKg).toBe(5);
    expect(feb!.hours).toBe(1);
    expect(feb!.trips).toBe(1);
    expect(feb!.cpueHr).toBe(5);

    for (const t of trends) {
      expect(typeof t.totalKg).toBe("number");
      expect(typeof t.valuePhp).toBe("number");
      expect(typeof t.hours).toBe("number");
      expect(typeof t.cpueHr).toBe("number");
      expect(typeof t.cpueTrip).toBe("number");
    }
  });

  it("tenant B never sees tenant A's monthly data", async () => {
    const trends = await caller(testTenantBId, testUserBId).catchTrends({});
    expect(trends).toHaveLength(1);
    expect(trends[0]!.totalKg).toBe(9);
    expect(trends[0]!.totalKg).not.toBe(30);
  });
});

describe.skipIf(!hasDb)("fishCatchAnalytics.bySpecies", () => {
  it("sums weights/values per species, sorted desc, no Decimal leakage", async () => {
    const species = await caller(testTenantAId).bySpecies({});

    // Bangus: 6 + 14 = 20kg (largest)
    // Tilapia: 4 + 5 = 9kg
    // Galunggong: 6kg
    expect(species[0]!.commonName).toBe("Bangus");
    expect(species[0]!.totalKg).toBe(20);
    expect(species[0]!.valuePhp).toBe(2600);

    const tilapia = species.find((s) => s.commonName === "Tilapia");
    expect(tilapia!.totalKg).toBe(9);

    const galunggong = species.find((s) => s.commonName === "Galunggong");
    expect(galunggong!.totalKg).toBe(6);

    // Sorted desc by totalKg
    for (let i = 1; i < species.length; i++) {
      expect(species[i - 1]!.totalKg).toBeGreaterThanOrEqual(species[i]!.totalKg);
    }

    for (const s of species) {
      expect(typeof s.totalKg).toBe("number");
      expect(typeof s.valuePhp).toBe("number");
    }
  });

  it("tenant B never sees tenant A's species", async () => {
    const species = await caller(testTenantBId, testUserBId).bySpecies({});
    expect(species).toHaveLength(1);
    expect(species[0]!.commonName).toBe("Tuna");
  });
});

describe.skipIf(!hasDb)("fishCatchAnalytics.byGearType", () => {
  it("sums per gear type, no Decimal leakage", async () => {
    const gears = await caller(testTenantAId).byGearType({});

    const hookAndLine = gears.find((g) => g.gearType === "HOOK_AND_LINE");
    const gillNet = gears.find((g) => g.gearType === "GILL_NET");

    // HOOK_AND_LINE: catch1 (10kg/5hr) + catch3 (5kg/1hr) = 15kg / 6hr
    expect(hookAndLine!.totalKg).toBe(15);
    expect(hookAndLine!.hours).toBe(6);
    expect(hookAndLine!.trips).toBe(2);
    expect(hookAndLine!.cpueHr).toBeCloseTo(15 / 6, 6);

    // GILL_NET: catch2 (20kg/4hr)
    expect(gillNet!.totalKg).toBe(20);
    expect(gillNet!.trips).toBe(1);

    for (const g of gears) {
      expect(typeof g.totalKg).toBe("number");
      expect(typeof g.hours).toBe("number");
      expect(typeof g.cpueHr).toBe("number");
    }
  });

  it("tenant B never sees tenant A's gear-type data", async () => {
    const gears = await caller(testTenantBId, testUserBId).byGearType({});
    expect(gears).toHaveLength(1);
    expect(gears[0]!.gearType).toBe("LONGLINE");
    expect(gears.some((g) => g.gearType === "HOOK_AND_LINE")).toBe(false);
    expect(gears.some((g) => g.gearType === "GILL_NET")).toBe(false);
  });
});

describe.skipIf(!hasDb)("fishCatchAnalytics.byBarangay", () => {
  it("sums per barangay, sorted desc, no Decimal leakage", async () => {
    const barangays = await caller(testTenantAId).byBarangay({});

    const one = barangays.find((b) => b.barangay === "Barangay One");
    const two = barangays.find((b) => b.barangay === "Barangay Two");

    // Barangay One: catch1 (10kg) + catch3 (5kg) = 15kg
    expect(one!.totalKg).toBe(15);
    expect(one!.trips).toBe(2);

    // Barangay Two: catch2 (20kg)
    expect(two!.totalKg).toBe(20);
    expect(two!.trips).toBe(1);

    for (let i = 1; i < barangays.length; i++) {
      expect(barangays[i - 1]!.totalKg).toBeGreaterThanOrEqual(barangays[i]!.totalKg);
    }

    for (const b of barangays) {
      expect(typeof b.totalKg).toBe("number");
    }
  });

  it("tenant B never sees tenant A's barangay data", async () => {
    const barangays = await caller(testTenantBId, testUserBId).byBarangay({});
    expect(barangays).toHaveLength(1);
    expect(barangays[0]!.barangay).toBe("Barangay B");
    expect(barangays.some((b) => b.barangay === "Barangay One")).toBe(false);
    expect(barangays.some((b) => b.barangay === "Barangay Two")).toBe(false);
  });
});

describe.skipIf(!hasDb)("fishCatchAnalytics.topFishers", () => {
  it("returns joined names + correct totals, no Decimal leakage", async () => {
    const fishers = await caller(testTenantAId).topFishers({});

    // ffOne: catch1 (10kg) + catch3 (5kg) = 15kg
    // ffTwo: catch2 (20kg)
    const one = fishers.find((f) => f.fisherfolkId === ffOneId);
    const two = fishers.find((f) => f.fisherfolkId === ffTwoId);

    expect(one).toBeDefined();
    expect(two).toBeDefined();
    expect(one!.totalKg).toBe(15);
    expect(two!.totalKg).toBe(20);
    expect(one!.name).toContain("Fisher");
    expect(two!.name).toContain("Fisher");

    for (const f of fishers) {
      expect(typeof f.totalKg).toBe("number");
    }
  });

  it("tenant B only sees its own fisher", async () => {
    const fishers = await caller(testTenantBId, testUserBId).topFishers({});
    expect(fishers).toHaveLength(1);
    expect(fishers[0]!.fisherfolkId).toBe(ffBId);
    expect(fishers[0]!.totalKg).toBe(9);
    expect(fishers.some((f) => f.fisherfolkId === ffOneId)).toBe(false);
    expect(fishers.some((f) => f.fisherfolkId === ffTwoId)).toBe(false);
  });
});

describe.skipIf(!hasDb)("fishCatchAnalytics.topVessels", () => {
  it("returns joined vessel names + correct totals, no Decimal leakage", async () => {
    const vessels = await caller(testTenantAId).topVessels({});

    // Only catch1 (vesselOne, 10kg) and catch2 (vesselTwo, 20kg) have a vessel.
    expect(vessels).toHaveLength(2);

    const one = vessels.find((v) => v.vesselId === vesselOneId);
    const two = vessels.find((v) => v.vesselId === vesselTwoId);

    expect(one).toBeDefined();
    expect(two).toBeDefined();
    expect(one!.totalKg).toBe(10);
    expect(two!.totalKg).toBe(20);
    expect(one!.name).toBe("Vessel One");
    expect(two!.name).toBe("Vessel Two");

    // Sorted desc
    expect(vessels[0]!.vesselId).toBe(vesselTwoId);

    for (const v of vessels) {
      expect(typeof v.totalKg).toBe("number");
    }
  });

  it("tenant B never sees tenant A's vessels (no vessel on tenant B's catch)", async () => {
    const vessels = await caller(testTenantBId, testUserBId).topVessels({});
    expect(vessels).toHaveLength(0);
  });
});
