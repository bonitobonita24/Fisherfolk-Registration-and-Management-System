/**
 * Integration tests — fishCatch tRPC router
 * (create / list / getById / update / delete + tenant isolation)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/fishCatch.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — protectedProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../context";
import { fishCatchRouter } from "./fishCatch";
import { createCallerFactory } from "../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG_A = `fc-test-a-${RUN}`;
const SLUG_B = `fc-test-b-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantAId: string;
let testTenantBId: string;
let testUserId: string;
let testUserBId: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(tenantId: string, userId: string): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Test Admin", email: "admin@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId,
    role: "tenant_superadmin",
    tenantId,
    tenantSlug: SLUG_A,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(fishCatchRouter);
const caller = (tenantId: string, userId: string = testUserId) =>
  callerFactory(makeCtx(tenantId, userId));

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
      idNumber: `FCFF-${RUN}-${n}`,
      fullName: `FCTok${RUN} Fisher ${n}`,
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

function baseInput(fisherfolkId: string, overrides: Record<string, unknown> = {}) {
  return {
    fisherfolkId,
    landingDate: new Date(`${new Date().getFullYear()}-01-15`),
    gearType: "HOOK_AND_LINE" as const,
    totalCatchKg: 15,
    species: [
      { commonName: "Bangus", weightKg: 10 },
      { commonName: "Tilapia", weightKg: 5 },
    ],
    ...overrides,
  };
}

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
      name: "FC Test Tenant A",
      slug: SLUG_A,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantAId = tenantA.id;

  const tenantB = await platformPrisma.tenant.create({
    data: {
      name: "FC Test Tenant B",
      slug: SLUG_B,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantBId = tenantB.id;

  const user = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `fc-admin-${RUN}@local`,
      username: `fc-admin-${RUN}`,
      passwordHash: "not-real",
      name: "Test Admin",
      role: "tenant_superadmin",
    },
  });
  testUserId = user.id;

  const userB = await platformPrisma.user.create({
    data: {
      tenantId: testTenantBId,
      email: `fc-admin-b-${RUN}@local`,
      username: `fc-admin-b-${RUN}`,
      passwordHash: "not-real",
      name: "Test Admin B",
      role: "tenant_superadmin",
    },
  });
  testUserBId = userB.id;
});

afterAll(async () => {
  if (!hasDb) return;

  for (const tenantId of [testTenantAId, testTenantBId]) {
    if (!tenantId) continue;
    await platformPrisma.fishCatchSpecies.deleteMany({ where: { tenantId } });
    await platformPrisma.fishCatch.deleteMany({ where: { tenantId } });
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

describe.skipIf(!hasDb)("fishCatch.create", () => {
  it("creates a record with species, auto-generates FC reference number", async () => {
    const ff = await makeFisherfolk(testTenantAId);

    const created = await caller(testTenantAId).create(baseInput(ff.id));

    expect(created.referenceNo).toMatch(/^FC-\d{4}-\d{4}$/);
    expect(created.totalCatchKg).toBe(15);
    expect(created.species).toHaveLength(2);

    const persisted = await platformPrisma.fishCatch.findUnique({
      where: { id: created.id },
      include: { species: true },
    });
    expect(persisted).not.toBeNull();
    expect(Number(persisted!.totalCatchKg)).toBe(15);
    expect(persisted!.species).toHaveLength(2);
    for (const s of persisted!.species) {
      expect(s.tenantId).toBe(testTenantAId);
    }
  });

  it("rejects when species weights don't sum to totalCatchKg", async () => {
    const ff = await makeFisherfolk(testTenantAId);
    await expect(
      caller(testTenantAId).create(
        baseInput(ff.id, { totalCatchKg: 999 }) as never,
      ),
    ).rejects.toBeTruthy();
  });
});

describe.skipIf(!hasDb)("fishCatch.list / getById", () => {
  it("list returns tenant-scoped records", async () => {
    const ff = await makeFisherfolk(testTenantAId);
    const created = await caller(testTenantAId).create(baseInput(ff.id));

    const result = await caller(testTenantAId).list({});
    const ids = result.items.map((i) => i.id);
    expect(ids).toContain(created.id);
    expect(result.total).toBeGreaterThanOrEqual(1);
  });

  it("getById includes species", async () => {
    const ff = await makeFisherfolk(testTenantAId);
    const created = await caller(testTenantAId).create(baseInput(ff.id));

    const fetched = await caller(testTenantAId).getById({ id: created.id });
    expect(fetched.species).toHaveLength(2);
    expect(fetched.totalCatchKg).toBe(15);
  });
});

describe.skipIf(!hasDb)("fishCatch.update", () => {
  it("replaces species on update", async () => {
    const ff = await makeFisherfolk(testTenantAId);
    const created = await caller(testTenantAId).create(baseInput(ff.id));

    const updated = await caller(testTenantAId).update({
      id: created.id,
      data: {
        totalCatchKg: 8,
        species: [{ commonName: "Galunggong", weightKg: 8 }],
      },
    });

    expect(updated.species).toHaveLength(1);
    expect(updated.species[0]!.commonName).toBe("Galunggong");

    const speciesRows = await platformPrisma.fishCatchSpecies.findMany({
      where: { fishCatchId: created.id },
    });
    expect(speciesRows).toHaveLength(1);
  });
});

describe.skipIf(!hasDb)("fishCatch.delete", () => {
  it("cascades species deletion", async () => {
    const ff = await makeFisherfolk(testTenantAId);
    const created = await caller(testTenantAId).create(baseInput(ff.id));

    const result = await caller(testTenantAId).delete({ id: created.id });
    expect(result).toEqual({ ok: true });

    const record = await platformPrisma.fishCatch.findUnique({
      where: { id: created.id },
    });
    expect(record).toBeNull();

    const speciesRows = await platformPrisma.fishCatchSpecies.findMany({
      where: { fishCatchId: created.id },
    });
    expect(speciesRows).toHaveLength(0);
  });
});

describe.skipIf(!hasDb)("fishCatch tenant isolation", () => {
  it("a second tenant cannot getById another tenant's record", async () => {
    const ff = await makeFisherfolk(testTenantAId);
    const created = await caller(testTenantAId).create(baseInput(ff.id));

    await expect(
      caller(testTenantBId, testUserBId).getById({ id: created.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
