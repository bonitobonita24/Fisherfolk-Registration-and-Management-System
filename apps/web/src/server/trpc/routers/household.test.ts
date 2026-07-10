/**
 * Integration tests — household tRPC router
 * (create / update / remove / availableFisherfolk)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/household.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — protectedProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../context";
import { householdRouter } from "./household";
import { createCallerFactory } from "../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG_A = `hh-test-a-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantAId: string;
let testUserId: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(tenantId: string): TRPCContext {
  return {
    session: {
      user: { id: testUserId, name: "Test Admin", email: "admin@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId: testUserId,
    role: "tenant_superadmin",
    tenantId,
    tenantSlug: SLUG_A,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(householdRouter);
const caller = (tenantId: string) => callerFactory(makeCtx(tenantId));

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
      idNumber: `HHFF-${RUN}-${n}`,
      fullName: `HHTok${RUN} Fisher ${n}`,
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

/** Null every fisherfolk's householdId then delete all households in a tenant. */
async function wipeHouseholds(tenantId: string) {
  await platformPrisma.fisherfolk.updateMany({
    where: { tenantId },
    data: { householdId: null },
  });
  await platformPrisma.household.deleteMany({ where: { tenantId } });
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  const existing = await platformPrisma.tenant.findUnique({
    where: { slug: SLUG_A },
  });
  if (existing) {
    await platformPrisma.household.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.fisherfolk.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.tenant.delete({ where: { id: existing.id } });
  }

  const tenantA = await platformPrisma.tenant.create({
    data: {
      name: "HH Test Tenant A",
      slug: SLUG_A,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantAId = tenantA.id;

  const user = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `hh-admin-${RUN}@local`,
      username: `hh-admin-${RUN}`,
      passwordHash: "not-real",
      name: "Test Admin",
      role: "tenant_superadmin",
    },
  });
  testUserId = user.id;
});

afterAll(async () => {
  if (!hasDb) return;
  if (!testTenantAId) return;

  await platformPrisma.fisherfolk.updateMany({
    where: { tenantId: testTenantAId },
    data: { householdId: null },
  });
  await platformPrisma.household.deleteMany({
    where: { tenantId: testTenantAId },
  });
  await platformPrisma.fisherfolk.deleteMany({
    where: { tenantId: testTenantAId },
  });
  await platformPrisma.user.deleteMany({ where: { tenantId: testTenantAId } });
  await platformPrisma.tenant
    .delete({ where: { id: testTenantAId } })
    .catch(() => {
      /* already gone */
    });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("household.create", () => {
  it("create assigns head + members and auto-generates HH number", async () => {
    await wipeHouseholds(testTenantAId);

    const head = await makeFisherfolk(testTenantAId, {
      barangay: "Barangay Uno",
      address: "Head Address 1",
    });
    const m1 = await makeFisherfolk(testTenantAId);
    const m2 = await makeFisherfolk(testTenantAId);

    const { id } = await caller(testTenantAId).create({
      headId: head.id,
      memberIds: [m1.id, m2.id],
    });

    const household = await platformPrisma.household.findUnique({
      where: { id },
    });
    expect(household).not.toBeNull();
    // First household in a clean tenant → HH-0001
    expect(household!.householdNumber).toBe("HH-0001");
    expect(household!.headId).toBe(head.id);
    // barangay/address default from the head when omitted
    expect(household!.barangay).toBe("Barangay Uno");
    expect(household!.address).toBe("Head Address 1");

    // Head + both members point at the household (head is also a member)
    const linked = await platformPrisma.fisherfolk.findMany({
      where: { householdId: id },
      select: { id: true },
    });
    expect(linked.map((r) => r.id).sort()).toEqual(
      [head.id, m1.id, m2.id].sort(),
    );
  });

  it("rejects adding an already-assigned fisherfolk", async () => {
    const head1 = await makeFisherfolk(testTenantAId);
    const shared = await makeFisherfolk(testTenantAId);

    // Put `shared` into a first household as a member
    await caller(testTenantAId).create({
      headId: head1.id,
      memberIds: [shared.id],
    });

    // A new household trying to claim `shared` again must be rejected
    const head2 = await makeFisherfolk(testTenantAId);
    await expect(
      caller(testTenantAId).create({
        headId: head2.id,
        memberIds: [shared.id],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe.skipIf(!hasDb)("household.update", () => {
  it("change head must target a current member", async () => {
    const head = await makeFisherfolk(testTenantAId);
    const member = await makeFisherfolk(testTenantAId);
    const outsider = await makeFisherfolk(testTenantAId); // never a member

    const { id } = await caller(testTenantAId).create({
      headId: head.id,
      memberIds: [member.id],
    });

    // Non-member → rejected
    await expect(
      caller(testTenantAId).update({ id, newHeadId: outsider.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    // Current member → succeeds and flips the head
    await caller(testTenantAId).update({ id, newHeadId: member.id });
    const household = await platformPrisma.household.findUnique({
      where: { id },
    });
    expect(household!.headId).toBe(member.id);
  });
});

describe.skipIf(!hasDb)("household.remove", () => {
  it("remove unlinks members without deleting fisherfolk", async () => {
    const head = await makeFisherfolk(testTenantAId);
    const m1 = await makeFisherfolk(testTenantAId);
    const m2 = await makeFisherfolk(testTenantAId);

    const { id } = await caller(testTenantAId).create({
      headId: head.id,
      memberIds: [m1.id, m2.id],
    });

    const result = await caller(testTenantAId).remove({ id });
    expect(result).toEqual({ ok: true });

    // Household gone
    const household = await platformPrisma.household.findUnique({
      where: { id },
    });
    expect(household).toBeNull();

    // Fisherfolk still exist, unlinked
    const survivors = await platformPrisma.fisherfolk.findMany({
      where: { id: { in: [head.id, m1.id, m2.id] } },
      select: { id: true, householdId: true },
    });
    expect(survivors).toHaveLength(3);
    for (const s of survivors) expect(s.householdId).toBeNull();
  });
});

describe.skipIf(!hasDb)("household.availableFisherfolk", () => {
  it("excludes assigned fisherfolk", async () => {
    const unassigned = await makeFisherfolk(testTenantAId);
    const head = await makeFisherfolk(testTenantAId);
    const assigned = await makeFisherfolk(testTenantAId);

    await caller(testTenantAId).create({
      headId: head.id,
      memberIds: [assigned.id],
    });

    // Narrow to this test's fisherfolk via the shared run token
    const results = await caller(testTenantAId).availableFisherfolk({
      search: `HHTok${RUN}`,
    });
    const ids = results.map((r) => r.id);

    expect(ids).toContain(unassigned.id);
    expect(ids).not.toContain(assigned.id);
    expect(ids).not.toContain(head.id);
  });
});
