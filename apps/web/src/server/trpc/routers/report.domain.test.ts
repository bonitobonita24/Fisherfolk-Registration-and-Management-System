/**
 * Integration tests — universal Report Hub domain procedures (M4 T8)
 * (getDomainReport / getDomainChartData / getDomainFacets / exportDomainExcel)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/report.domain.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — protectedProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../context";
import { reportRouter } from "./report";
import { householdRouter } from "./household";
import { createCallerFactory } from "../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG_A = `rpt-test-a-${RUN}`;
const SLUG_B = `rpt-test-b-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantAId: string;
let testTenantBId: string;
let testUserAId: string; // admin, tenant A
let testViewerAId: string; // viewer, tenant A
let testUserBId: string; // admin, tenant B

let otherTenantFfId: string; // seeded fisherfolk in tenant B (isolation probe)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(
  tenantId: string,
  userId: string,
  role: "admin" | "viewer" = "admin",
): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Test User", email: "user@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId,
    role,
    tenantId,
    tenantSlug: SLUG_A,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const reportCallerFactory = createCallerFactory(reportRouter);
const householdCallerFactory = createCallerFactory(householdRouter);

const reportCaller = (
  tenantId: string,
  userId: string,
  role: "admin" | "viewer" = "admin",
) => reportCallerFactory(makeCtx(tenantId, userId, role));

const householdCaller = (tenantId: string, userId: string) =>
  householdCallerFactory(makeCtx(tenantId, userId, "admin"));

const TARGET_BARANGAY = `RptTargetBrgy-${RUN}`;
const OTHER_BARANGAY = `RptOtherBrgy-${RUN}`;

let ffSeq = 0;
async function makeFisherfolk(
  tenantId: string,
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  ffSeq += 1;
  const n = ffSeq;
  return platformPrisma.fisherfolk.create({
    data: {
      tenantId,
      idNumber: `RPTFF-${RUN}-${n}`,
      fullName: `RptTok${RUN} Fisher ${n}`,
      lastName: `Fisher${n}`,
      firstName: "Test",
      address: `${n} Test St`,
      barangay: TARGET_BARANGAY,
      categoryIds: [],
      registrationYear: new Date().getFullYear(),
      createdById: userId,
      updatedById: userId,
      ...overrides,
    },
  });
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

async function wipeTenant(tenantId: string) {
  await platformPrisma.fishCatchSpecies.deleteMany({ where: { tenantId } });
  await platformPrisma.fishCatch.deleteMany({ where: { tenantId } });
  await platformPrisma.ayudaBeneficiary.deleteMany({ where: { tenantId } });
  await platformPrisma.ayudaProgram.deleteMany({ where: { tenantId } });
  await platformPrisma.violation.deleteMany({ where: { tenantId } });
  await platformPrisma.vessel.deleteMany({ where: { tenantId } });
  await platformPrisma.fisherfolk.updateMany({
    where: { tenantId },
    data: { householdId: null },
  });
  await platformPrisma.household.deleteMany({ where: { tenantId } });
  await platformPrisma.fisherfolk.deleteMany({ where: { tenantId } });
  await platformPrisma.auditLog.deleteMany({ where: { tenantId } });
  await platformPrisma.user.deleteMany({ where: { tenantId } });
}

beforeAll(async () => {
  if (!hasDb) return;

  for (const slug of [SLUG_A, SLUG_B]) {
    const existing = await platformPrisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      await wipeTenant(existing.id);
      await platformPrisma.tenant.delete({ where: { id: existing.id } });
    }
  }

  const tenantA = await platformPrisma.tenant.create({
    data: {
      name: "Report Test Tenant A",
      slug: SLUG_A,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantAId = tenantA.id;

  const tenantB = await platformPrisma.tenant.create({
    data: {
      name: "Report Test Tenant B",
      slug: SLUG_B,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantBId = tenantB.id;

  const userA = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `rpt-admin-${RUN}@local`,
      username: `rpt-admin-${RUN}`,
      passwordHash: "not-real",
      name: "Test Admin A",
      role: "admin",
    },
  });
  testUserAId = userA.id;

  const viewerA = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `rpt-viewer-${RUN}@local`,
      username: `rpt-viewer-${RUN}`,
      passwordHash: "not-real",
      name: "Test Viewer A",
      role: "viewer",
    },
  });
  testViewerAId = viewerA.id;

  const userB = await platformPrisma.user.create({
    data: {
      tenantId: testTenantBId,
      email: `rpt-admin-b-${RUN}@local`,
      username: `rpt-admin-b-${RUN}`,
      passwordHash: "not-real",
      name: "Test Admin B",
      role: "admin",
    },
  });
  testUserBId = userB.id;

  // ── Fixtures — tenant A ─────────────────────────────────────────────────

  // Fisherfolk: 2 in TARGET_BARANGAY (ACTIVE), 1 in OTHER_BARANGAY.
  const ff1 = await makeFisherfolk(testTenantAId, testUserAId, {
    barangay: TARGET_BARANGAY,
    status: "ACTIVE",
    dateOfBirth: new Date("1980-01-01"),
  });
  void ff1;
  await makeFisherfolk(testTenantAId, testUserAId, {
    barangay: TARGET_BARANGAY,
    status: "ACTIVE",
    dateOfBirth: new Date("1990-01-01"),
  });
  await makeFisherfolk(testTenantAId, testUserAId, {
    barangay: OTHER_BARANGAY,
    status: "NEW",
    dateOfBirth: new Date("1995-01-01"),
  });

  // Household — head is a 4th fisherfolk.
  const head = await makeFisherfolk(testTenantAId, testUserAId, {
    barangay: TARGET_BARANGAY,
  });
  await householdCaller(testTenantAId, testUserAId).create({ headId: head.id });

  // Vessel + owner.
  await platformPrisma.vessel.create({
    data: {
      tenantId: testTenantAId,
      mfvrNumber: `RPTV-${RUN}`,
      vesselName: `Rpt Vessel ${RUN}`,
      vesselType: "MOTORIZED",
      homeport: TARGET_BARANGAY,
      status: "ACTIVE",
      createdById: testUserAId,
      owners: { connect: [{ id: ff1.id }] },
    },
  });

  // Violation.
  await platformPrisma.violation.create({
    data: {
      tenantId: testTenantAId,
      targetType: "FISHERFOLK",
      fisherfolkId: ff1.id,
      subject: `Rpt Violation ${RUN}`,
      status: "ACTIVE",
      filedById: testUserAId,
    },
  });

  // Ayuda program + beneficiary.
  const program = await platformPrisma.ayudaProgram.create({
    data: {
      tenantId: testTenantAId,
      title: `Rpt Program ${RUN}`,
      filters: {},
      status: "ACTIVE",
      distributionUnit: "FISHERFOLK",
      createdById: testUserAId,
    },
  });
  await platformPrisma.ayudaBeneficiary.create({
    data: {
      tenantId: testTenantAId,
      programId: program.id,
      fisherfolkId: ff1.id,
      verificationStatus: "RECEIVED",
    },
  });

  // Fish catch + species.
  const fishCatch = await platformPrisma.fishCatch.create({
    data: {
      tenantId: testTenantAId,
      referenceNo: `FC-RPT-${RUN}`,
      fisherfolkId: ff1.id,
      landingDate: new Date(`${new Date().getFullYear()}-01-15`),
      fishingGroundBarangay: TARGET_BARANGAY,
      gearType: "HOOK_AND_LINE",
      totalCatchKg: 12,
      source: "FMO_ENUMERATOR",
    },
  });
  await platformPrisma.fishCatchSpecies.create({
    data: {
      tenantId: testTenantAId,
      fishCatchId: fishCatch.id,
      commonName: "Bangus",
      weightKg: 12,
    },
  });

  // ── Fixtures — tenant B (isolation probe) ───────────────────────────────

  const ffB = await makeFisherfolk(testTenantBId, testUserBId, {
    barangay: `RptTenantB-${RUN}`,
    status: "ACTIVE",
  });
  otherTenantFfId = ffB.id;
});

afterAll(async () => {
  if (!hasDb) return;
  await wipeTenant(testTenantAId);
  await wipeTenant(testTenantBId);
  await platformPrisma.tenant
    .delete({ where: { id: testTenantAId } })
    .catch(() => {
      /* already gone */
    });
  await platformPrisma.tenant
    .delete({ where: { id: testTenantBId } })
    .catch(() => {
      /* already gone */
    });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("report.getDomainReport", () => {
  it("returns fisherfolk columns/rows scoped to the tenant, excluding another tenant's rows", async () => {
    const result = await reportCaller(testTenantAId, testUserAId).getDomainReport({
      domain: "fisherfolk",
      filter: {},
    });

    expect(result.columns.length).toBeGreaterThan(0);
    expect(result.rows).toHaveLength(4); // 3 target + 1 household head
    expect(result.count).toBe(4);

    const idNumbers = result.rows.map((r) => r.idNumber);
    const otherFf = await platformPrisma.fisherfolk.findUnique({
      where: { id: otherTenantFfId },
    });
    expect(idNumbers).not.toContain(otherFf!.idNumber);
  });

  it("returns fish-catch rows including the seeded referenceNo", async () => {
    const result = await reportCaller(testTenantAId, testUserAId).getDomainReport({
      domain: "fish-catch",
      filter: {},
    });

    expect(result.count).toBe(1);
    expect(result.rows[0]!.referenceNo).toBe(`FC-RPT-${RUN}`);
  });

  it("narrows rows by a barangays filter", async () => {
    const result = await reportCaller(testTenantAId, testUserAId).getDomainReport({
      domain: "fisherfolk",
      filter: { barangays: [TARGET_BARANGAY] },
    });

    expect(result.rows.length).toBe(3); // 2 seeded + household head, all TARGET_BARANGAY
    for (const row of result.rows) {
      expect(row.barangay).toBe(TARGET_BARANGAY);
    }
  });
});

describe.skipIf(!hasDb)("report.getDomainChartData", () => {
  it("returns non-empty charts whose byStatus tally reconciles with the ledger row count", async () => {
    const [report, chartData] = await Promise.all([
      reportCaller(testTenantAId, testUserAId).getDomainReport({
        domain: "fisherfolk",
        filter: {},
      }),
      reportCaller(testTenantAId, testUserAId).getDomainChartData({
        domain: "fisherfolk",
        filter: {},
      }),
    ]);

    expect(chartData.charts.length).toBeGreaterThan(0);
    const byStatus = chartData.charts.find((c) => c.key === "byStatus");
    expect(byStatus).toBeDefined();
    const totalFromChart = byStatus!.data.reduce((sum, d) => sum + d.value, 0);
    expect(totalFromChart).toBe(report.count);
  });
});

describe.skipIf(!hasDb)("report.getDomainFacets", () => {
  it("fisherfolk facets include the seeded barangays", async () => {
    const facets = await reportCaller(testTenantAId, testUserAId).getDomainFacets({
      domain: "fisherfolk",
    });

    expect(facets.barangays).toContain(TARGET_BARANGAY);
    expect(facets.barangays).toContain(OTHER_BARANGAY);
  });

  it("fish-catch facets return a non-empty gearTypes list", async () => {
    const facets = await reportCaller(testTenantAId, testUserAId).getDomainFacets({
      domain: "fish-catch",
    });

    expect(facets.gearTypes.length).toBeGreaterThan(0);
  });
});

describe.skipIf(!hasDb)("report.exportDomainExcel", () => {
  it("returns a workbook for an admin caller", async () => {
    const result = await reportCaller(testTenantAId, testUserAId).exportDomainExcel({
      domain: "fisherfolk",
      filter: {},
    });

    expect(result.filename).toMatch(/^fisherfolk-report_.*\.xlsx$/);
    expect(result.base64.length).toBeGreaterThan(0);
  });

  it("rejects a viewer caller (admin-only gate)", async () => {
    await expect(
      reportCaller(testTenantAId, testViewerAId, "viewer").exportDomainExcel({
        domain: "fisherfolk",
        filter: {},
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
