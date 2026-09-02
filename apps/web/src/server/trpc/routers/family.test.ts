/**
 * Integration tests — family tRPC router (FIS-8 Phase B)
 * (create / update / remove — multi-family households)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/family.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — protectedProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads.
 *
 * A household is created via householdRouter (which now seeds an initial
 * "F-01" family, Phase B); familyRouter then splits members into new families.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../context";
import { familyRouter } from "./family";
import { householdRouter } from "./household";
import { createCallerFactory } from "../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG_A = `fam-test-a-${RUN}`;

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

const familyCallerFactory = createCallerFactory(familyRouter);
const familyCaller = (tenantId: string) =>
  familyCallerFactory(makeCtx(tenantId));

const householdCallerFactory = createCallerFactory(householdRouter);
const householdCaller = (tenantId: string) =>
  householdCallerFactory(makeCtx(tenantId));

let ffSeq = 0;
async function makeFisherfolk(tenantId: string) {
  ffSeq += 1;
  const n = ffSeq;
  return platformPrisma.fisherfolk.create({
    data: {
      tenantId,
      idNumber: `FAMFF-${RUN}-${n}`,
      fullName: `FamTok${RUN} Fisher ${n}`,
      lastName: `Fisher${n}`,
      firstName: "Test",
      address: `${n} Test St`,
      barangay: "Barangay Test",
      categoryIds: [],
      registrationYear: new Date().getFullYear(),
      createdById: testUserId,
      updatedById: testUserId,
    },
  });
}

/** Full reset: unlink members from families + households, drop both. */
async function wipe(tenantId: string) {
  await platformPrisma.fisherfolk.updateMany({
    where: { tenantId },
    data: { householdId: null, familyId: null },
  });
  await platformPrisma.family.deleteMany({ where: { tenantId } });
  await platformPrisma.household.deleteMany({ where: { tenantId } });
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  const existing = await platformPrisma.tenant.findUnique({
    where: { slug: SLUG_A },
  });
  if (existing) {
    await platformPrisma.fisherfolk.updateMany({
      where: { tenantId: existing.id },
      data: { householdId: null, familyId: null },
    });
    await platformPrisma.family.deleteMany({ where: { tenantId: existing.id } });
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
      name: "Family Test Tenant A",
      slug: SLUG_A,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantAId = tenantA.id;

  const user = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `fam-admin-${RUN}@local`,
      username: `fam-admin-${RUN}`,
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
    data: { householdId: null, familyId: null },
  });
  await platformPrisma.family.deleteMany({ where: { tenantId: testTenantAId } });
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

/**
 * Seed a household with head + members. household.create now also seeds the
 * initial "F-01" family, so returns the household id and F-01's id.
 */
async function seedHousehold(headId: string, memberIds: string[]) {
  const { id: householdId } = await householdCaller(testTenantAId).create({
    headId,
    memberIds,
  });
  const f01 = await platformPrisma.family.findFirstOrThrow({
    where: { householdId },
  });
  return { householdId, f01Id: f01.id };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("household.create seeds an initial family (Phase B)", () => {
  it("a newly created household has one family F-01 with head + members", async () => {
    await wipe(testTenantAId);

    const head = await makeFisherfolk(testTenantAId);
    const m1 = await makeFisherfolk(testTenantAId);
    const m2 = await makeFisherfolk(testTenantAId);

    const { householdId, f01Id } = await seedHousehold(head.id, [m1.id, m2.id]);

    const f01 = await platformPrisma.family.findUnique({ where: { id: f01Id } });
    expect(f01).not.toBeNull();
    expect(f01!.familyNumber).toBe("F-01");
    expect(f01!.householdId).toBe(householdId);
    expect(f01!.headId).toBe(head.id);

    // Head + both members now carry familyId = F-01
    const inFamily = await platformPrisma.fisherfolk.findMany({
      where: { familyId: f01Id },
      select: { id: true },
    });
    expect(inFamily.map((r) => r.id).sort()).toEqual(
      [head.id, m1.id, m2.id].sort(),
    );
  });
});

describe.skipIf(!hasDb)("family.create", () => {
  it("splits members into a second family F-02 and reassigns familyId", async () => {
    await wipe(testTenantAId);

    const head = await makeFisherfolk(testTenantAId);
    const m1 = await makeFisherfolk(testTenantAId);
    const m2 = await makeFisherfolk(testTenantAId);
    const { householdId } = await seedHousehold(head.id, [m1.id, m2.id]);

    // Form a new family from m1 (head) + m2, pulling them out of F-01
    const { id: f02Id } = await familyCaller(testTenantAId).create({
      householdId,
      headId: m1.id,
      memberIds: [m2.id],
    });

    const f02 = await platformPrisma.family.findUnique({ where: { id: f02Id } });
    expect(f02!.familyNumber).toBe("F-02");
    expect(f02!.headId).toBe(m1.id);

    const m1Row = await platformPrisma.fisherfolk.findUnique({
      where: { id: m1.id },
      select: { familyId: true, householdId: true },
    });
    const m2Row = await platformPrisma.fisherfolk.findUnique({
      where: { id: m2.id },
      select: { familyId: true },
    });
    expect(m1Row!.familyId).toBe(f02Id);
    expect(m1Row!.householdId).toBe(householdId); // still in the household
    expect(m2Row!.familyId).toBe(f02Id);
  });

  it("rejects a head that is not a member of the household", async () => {
    await wipe(testTenantAId);
    const head = await makeFisherfolk(testTenantAId);
    const { householdId } = await seedHousehold(head.id, []);
    const outsider = await makeFisherfolk(testTenantAId); // never in a household

    await expect(
      familyCaller(testTenantAId).create({
        householdId,
        headId: outsider.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a member from a different household", async () => {
    await wipe(testTenantAId);
    const headA = await makeFisherfolk(testTenantAId);
    const { householdId: hhA } = await seedHousehold(headA.id, []);

    const headB = await makeFisherfolk(testTenantAId);
    const memberB = await makeFisherfolk(testTenantAId);
    await seedHousehold(headB.id, [memberB.id]); // memberB belongs to hhB

    await expect(
      familyCaller(testTenantAId).create({
        householdId: hhA,
        headId: headA.id,
        memberIds: [memberB.id],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe.skipIf(!hasDb)("family.update", () => {
  it("change head must target a current family member", async () => {
    await wipe(testTenantAId);
    const head = await makeFisherfolk(testTenantAId);
    const m1 = await makeFisherfolk(testTenantAId);
    const { householdId, f01Id } = await seedHousehold(head.id, [m1.id]);
    const outsider = await makeFisherfolk(testTenantAId);
    await seedHousehold(outsider.id, []); // outsider is in a different household/family

    // Non-member → rejected
    await expect(
      familyCaller(testTenantAId).update({ id: f01Id, newHeadId: outsider.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    // Current member → succeeds and flips the head
    await familyCaller(testTenantAId).update({ id: f01Id, newHeadId: m1.id });
    const f01 = await platformPrisma.family.findUnique({ where: { id: f01Id } });
    expect(f01!.headId).toBe(m1.id);
    expect(householdId).toBeTruthy();
  });

  it("cannot remove the family head", async () => {
    await wipe(testTenantAId);
    const head = await makeFisherfolk(testTenantAId);
    const m1 = await makeFisherfolk(testTenantAId);
    const { f01Id } = await seedHousehold(head.id, [m1.id]);

    await expect(
      familyCaller(testTenantAId).update({
        id: f01Id,
        removeMemberIds: [head.id],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("removing a member clears its familyId (stays in household)", async () => {
    await wipe(testTenantAId);
    const head = await makeFisherfolk(testTenantAId);
    const m1 = await makeFisherfolk(testTenantAId);
    const { householdId, f01Id } = await seedHousehold(head.id, [m1.id]);

    await familyCaller(testTenantAId).update({
      id: f01Id,
      removeMemberIds: [m1.id],
    });

    const m1Row = await platformPrisma.fisherfolk.findUnique({
      where: { id: m1.id },
      select: { familyId: true, householdId: true },
    });
    expect(m1Row!.familyId).toBeNull();
    expect(m1Row!.householdId).toBe(householdId);
  });
});

describe.skipIf(!hasDb)("family.remove", () => {
  it("unlinks members' familyId and deletes the family (fisherfolk survive)", async () => {
    await wipe(testTenantAId);
    const head = await makeFisherfolk(testTenantAId);
    const m1 = await makeFisherfolk(testTenantAId);
    const m2 = await makeFisherfolk(testTenantAId);
    const { householdId } = await seedHousehold(head.id, [m1.id, m2.id]);

    // Split m1+m2 into F-02, then remove F-02
    const { id: f02Id } = await familyCaller(testTenantAId).create({
      householdId,
      headId: m1.id,
      memberIds: [m2.id],
    });

    const result = await familyCaller(testTenantAId).remove({ id: f02Id });
    expect(result).toEqual({ ok: true });

    const f02 = await platformPrisma.family.findUnique({ where: { id: f02Id } });
    expect(f02).toBeNull();

    // fisherfolk survive; familyId cleared; still in household
    for (const id of [m1.id, m2.id]) {
      const row = await platformPrisma.fisherfolk.findUnique({
        where: { id },
        select: { familyId: true, householdId: true },
      });
      expect(row).not.toBeNull();
      expect(row!.familyId).toBeNull();
      expect(row!.householdId).toBe(householdId);
    }
  });
});
