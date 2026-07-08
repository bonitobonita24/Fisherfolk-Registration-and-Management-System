/**
 * Integration tests — ayuda tRPC router
 * (per-household distribution unit: createProgram + addBeneficiary)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/ayuda.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — protectedProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../context";
import { ayudaRouter } from "./ayuda";
import { householdRouter } from "./household";
import { createCallerFactory } from "../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG_A = `ayuda-hh-test-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantId: string;
let testUserId: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(tenantId: string): TRPCContext {
  return {
    session: {
      user: { id: testUserId, name: "Test Admin", email: "admin@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId: testUserId,
    role: "admin",
    tenantId,
    tenantSlug: SLUG_A,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const ayudaCallerFactory = createCallerFactory(ayudaRouter);
const householdCallerFactory = createCallerFactory(householdRouter);
const ayudaCaller = (tenantId: string) => ayudaCallerFactory(makeCtx(tenantId));
const householdCaller = (tenantId: string) =>
  householdCallerFactory(makeCtx(tenantId));

let ffSeq = 0;
async function makeFisherfolk(
  tenantId: string,
  overrides: Record<string, unknown> = {},
) {
  ffSeq += 1;
  const n = ffSeq;
  return platformPrisma.fisherfolk.create({
    data: {
      tenantId,
      idNumber: `AYHHFF-${RUN}-${n}`,
      fullName: `AyudaHHTok${RUN} Fisher ${n}`,
      lastName: `Fisher${n}`,
      firstName: "Test",
      address: `${n} Test St`,
      barangay: "Barangay Test",
      categoryIds: [],
      registrationYear: new Date().getFullYear(),
      createdById: testUserId,
      updatedById: testUserId,
      ...overrides,
    },
  });
}

async function makeHousehold(tenantId: string) {
  const head = await makeFisherfolk(tenantId);
  const { id } = await householdCaller(tenantId).create({ headId: head.id });
  return { householdId: id, headId: head.id };
}

async function makeActiveProgram(
  tenantId: string,
  distributionUnit: "FISHERFOLK" | "HOUSEHOLD",
) {
  const program = await ayudaCaller(tenantId).createProgram({
    title: `Program ${distributionUnit} ${RUN}-${Math.random()}`,
    distributionUnit,
  });
  await ayudaCaller(tenantId).publishProgram({ id: program.id });
  return program.id;
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  const existing = await platformPrisma.tenant.findUnique({
    where: { slug: SLUG_A },
  });
  if (existing) {
    await platformPrisma.auditLog.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.ayudaBeneficiary.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.ayudaProgram.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.household.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.fisherfolk.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.tenant.delete({ where: { id: existing.id } });
  }

  const tenant = await platformPrisma.tenant.create({
    data: {
      name: "Ayuda HH Test Tenant",
      slug: SLUG_A,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantId = tenant.id;

  const user = await platformPrisma.user.create({
    data: {
      tenantId: testTenantId,
      email: `ayuda-hh-admin-${RUN}@local`,
      username: `ayuda-hh-admin-${RUN}`,
      passwordHash: "not-real",
      name: "Test Admin",
      role: "admin",
    },
  });
  testUserId = user.id;
});

afterAll(async () => {
  if (!hasDb) return;
  if (!testTenantId) return;

  await platformPrisma.auditLog.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.ayudaBeneficiary.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.ayudaProgram.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.fisherfolk.updateMany({
    where: { tenantId: testTenantId },
    data: { householdId: null },
  });
  await platformPrisma.household.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.fisherfolk.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.user.deleteMany({ where: { tenantId: testTenantId } });
  await platformPrisma.tenant
    .delete({ where: { id: testTenantId } })
    .catch(() => {
      /* already gone */
    });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("ayuda.createProgram — distributionUnit", () => {
  it("defaults to FISHERFOLK when omitted", async () => {
    const program = await ayudaCaller(testTenantId).createProgram({
      title: `Default Program ${RUN}`,
    });
    expect(program.distributionUnit).toBe("FISHERFOLK");
  });

  it("persists HOUSEHOLD when specified", async () => {
    const program = await ayudaCaller(testTenantId).createProgram({
      title: `Household Program ${RUN}`,
      distributionUnit: "HOUSEHOLD",
    });
    expect(program.distributionUnit).toBe("HOUSEHOLD");
  });
});

describe.skipIf(!hasDb)("ayuda.addBeneficiary — HOUSEHOLD distribution", () => {
  it("records the household head as beneficiary with householdId set", async () => {
    const programId = await makeActiveProgram(testTenantId, "HOUSEHOLD");
    const { householdId, headId } = await makeHousehold(testTenantId);

    const record = await ayudaCaller(testTenantId).addBeneficiary({
      programId,
      householdId,
    });

    expect(record.householdId).toBe(householdId);

    const stored = await platformPrisma.ayudaBeneficiary.findUnique({
      where: { id: record.id },
    });
    expect(stored).not.toBeNull();
    expect(stored!.fisherfolkId).toBe(headId);
    expect(stored!.householdId).toBe(householdId);
  });

  it("blocks re-adding the same household", async () => {
    const programId = await makeActiveProgram(testTenantId, "HOUSEHOLD");
    const { householdId } = await makeHousehold(testTenantId);

    await ayudaCaller(testTenantId).addBeneficiary({ programId, householdId });

    await expect(
      ayudaCaller(testTenantId).addBeneficiary({ programId, householdId }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects missing householdId when distributionUnit is HOUSEHOLD", async () => {
    const programId = await makeActiveProgram(testTenantId, "HOUSEHOLD");
    const ff = await makeFisherfolk(testTenantId);

    await expect(
      ayudaCaller(testTenantId).addBeneficiary({
        programId,
        fisherfolkId: ff.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe.skipIf(!hasDb)(
  "ayuda.addBeneficiary — FISHERFOLK distribution (unchanged)",
  () => {
    it("adds a fisherfolk beneficiary with no householdId", async () => {
      const programId = await makeActiveProgram(testTenantId, "FISHERFOLK");
      const ff = await makeFisherfolk(testTenantId);

      const record = await ayudaCaller(testTenantId).addBeneficiary({
        programId,
        fisherfolkId: ff.id,
      });

      expect(record.householdId).toBeNull();

      const stored = await platformPrisma.ayudaBeneficiary.findUnique({
        where: { id: record.id },
      });
      expect(stored!.fisherfolkId).toBe(ff.id);
      expect(stored!.householdId).toBeNull();
    });

    it("rejects missing fisherfolkId when distributionUnit is FISHERFOLK", async () => {
      const programId = await makeActiveProgram(testTenantId, "FISHERFOLK");
      const { householdId } = await makeHousehold(testTenantId);

      await expect(
        ayudaCaller(testTenantId).addBeneficiary({ programId, householdId }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  },
);
