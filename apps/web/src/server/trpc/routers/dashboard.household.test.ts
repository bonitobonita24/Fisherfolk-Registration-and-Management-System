/**
 * Integration tests — dashboard.getHouseholdStats (FIS-8 Phase D multi-family parity)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/dashboard.household.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — protectedProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads. Mirrors the fixture idiom
 * of report.domain.test.ts / family.test.ts and the context idiom of
 * dashboard.yoy.test.ts.
 *
 * getHouseholdStats.byCategory tallies FAMILY HEADS (not household heads) — a
 * household with 2 families/2 heads in the same category contributes 2. total
 * still counts HOUSEHOLDS, never families.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../context";
import { dashboardRouter } from "./dashboard";
import { familyRouter } from "./family";
import { householdRouter } from "./household";
import { createCallerFactory } from "../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG = `dash-hh-test-${RUN}`;
const CATEGORY_NAME = `DashHhCat-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let tenantId: string;
let userId: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(role: "tenant_superadmin" | "viewer" = "tenant_superadmin"): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Test Admin", email: "admin@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId,
    role,
    tenantId,
    tenantSlug: SLUG,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const dashboardCallerFactory = createCallerFactory(dashboardRouter);
const dashCaller = () => dashboardCallerFactory(makeCtx());

const householdCallerFactory = createCallerFactory(householdRouter);
const householdCaller = () => householdCallerFactory(makeCtx());

const familyCallerFactory = createCallerFactory(familyRouter);
const familyCaller = () => familyCallerFactory(makeCtx());

let ffSeq = 0;
async function makeFisherfolk(overrides: Record<string, unknown> = {}) {
  ffSeq += 1;
  const n = ffSeq;
  return platformPrisma.fisherfolk.create({
    data: {
      tenantId,
      idNumber: `DASHHHFF-${RUN}-${n}`,
      fullName: `DashHhTok${RUN} Fisher ${n}`,
      lastName: `Fisher${n}`,
      firstName: "Test",
      address: `${n} Test St`,
      barangay: `DashHhBrgy-${RUN}`,
      categoryIds: [],
      registrationYear: new Date().getFullYear(),
      createdById: userId,
      updatedById: userId,
      ...overrides,
    },
  });
}

async function wipeTenant(id: string) {
  await platformPrisma.fisherfolk.updateMany({
    where: { tenantId: id },
    data: { householdId: null, familyId: null },
  });
  await platformPrisma.family.deleteMany({ where: { tenantId: id } });
  await platformPrisma.household.deleteMany({ where: { tenantId: id } });
  await platformPrisma.fisherfolk.deleteMany({ where: { tenantId: id } });
  await platformPrisma.category.deleteMany({ where: { tenantId: id } });
  await platformPrisma.user.deleteMany({ where: { tenantId: id } });
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  const existing = await platformPrisma.tenant.findUnique({ where: { slug: SLUG } });
  if (existing) {
    await wipeTenant(existing.id);
    await platformPrisma.tenant.delete({ where: { id: existing.id } });
  }

  const tenant = await platformPrisma.tenant.create({
    data: {
      name: "Dashboard Household Test Tenant",
      slug: SLUG,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  tenantId = tenant.id;

  const user = await platformPrisma.user.create({
    data: {
      tenantId,
      email: `dash-hh-admin-${RUN}@local`,
      username: `dash-hh-admin-${RUN}`,
      passwordHash: "not-real",
      name: "Test Admin",
      role: "tenant_superadmin",
    },
  });
  userId = user.id;

  const category = await platformPrisma.category.create({
    data: {
      tenantId,
      name: CATEGORY_NAME,
      slug: `dash-hh-cat-${RUN}`,
      displayColor: "#654321",
    },
  });

  // ── Household A — single family: head + 1 member (parity baseline). ──────
  const headA = await makeFisherfolk({ categoryIds: [category.id] });
  const memberA1 = await makeFisherfolk();
  await householdCaller().create({
    headId: headA.id,
    memberIds: [memberA1.id],
  });

  // ── Household B — multi-family: 2 heads, BOTH in the shared category. ────
  const headB1 = await makeFisherfolk({ categoryIds: [category.id] });
  const memberB2 = await makeFisherfolk();
  const headB2 = await makeFisherfolk({ categoryIds: [category.id] });
  const { id: hhB } = await householdCaller().create({
    headId: headB1.id,
    memberIds: [memberB2.id, headB2.id],
  });
  await familyCaller().create({
    householdId: hhB,
    headId: headB2.id,
    memberIds: [],
  });
});

afterAll(async () => {
  if (!hasDb) return;
  if (!tenantId) return;
  await wipeTenant(tenantId);
  await platformPrisma.tenant.delete({ where: { id: tenantId } }).catch(() => {
    /* already gone */
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("dashboard.getHouseholdStats", () => {
  it("total counts households, not families (hhB has 2 families but is 1 household)", async () => {
    const stats = await dashCaller().getHouseholdStats();
    expect(stats.total).toBe(2); // hhA + hhB, even though 3 families exist total
  });

  it("byCategory counts EACH family head — a 2-head household in the same category contributes 2", async () => {
    const stats = await dashCaller().getHouseholdStats();
    const row = stats.byCategory.find((c) => c.category === CATEGORY_NAME);
    expect(row).toBeDefined();
    // headA (hhA, F-01) + headB1 (hhB, F-01) + headB2 (hhB, F-02) = 3
    expect(row!.count).toBe(3);
  });

  it("throws FORBIDDEN when no tenant is bound", async () => {
    const callerFactory = createCallerFactory(dashboardRouter);
    const caller = callerFactory({
      session: {
        user: { id: userId, name: "Test Admin", email: "admin@local" },
        expires: new Date(Date.now() + 3_600_000).toISOString(),
      } as unknown as Session,
      userId,
      role: "tenant_superadmin",
      tenantId: null,
      tenantSlug: SLUG,
      db: prisma,
      req: new Request("http://localhost/api/trpc"),
    });
    await expect(caller.getHouseholdStats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
