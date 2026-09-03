/**
 * Integration tests — fisherfolk tRPC router (renew, markIdReleased, getActivity)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/__tests__/fisherfolk.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — protectedProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../../context";
import { fisherfolkRouter } from "../fisherfolk";
import { createCallerFactory } from "../../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG_A = `ff-test-a-${RUN}`;
const SLUG_B = `ff-test-b-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantAId: string;
let testTenantBId: string;
let testUserId: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(tenantId: string, role: "encoder" | "tenant_superadmin" | "viewer" = "encoder"): TRPCContext {
  return {
    session: {
      user: { id: testUserId, name: "Test Encoder", email: "encoder@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId: testUserId,
    role,
    tenantId,
    tenantSlug: SLUG_A,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(fisherfolkRouter);
const caller = (tenantId: string, role: "encoder" | "tenant_superadmin" | "viewer" = "encoder") =>
  callerFactory(makeCtx(tenantId, role));

async function createTestFisherfolk(tenantId: string, overrides: Record<string, unknown> = {}) {
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return platformPrisma.fisherfolk.create({
    data: {
      tenantId,
      idNumber: `FF-${new Date().getFullYear()}-${seq}`,
      fullName: "Test Fisher",
      lastName: "Fisher",
      firstName: "Test",
      address: "123 Test St",
      barangay: "Barangay Test",
      registrationYear: new Date().getFullYear(),
      createdById: testUserId,
      updatedById: testUserId,
      ...overrides,
    },
  });
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  // Clean up stale runs with same slugs
  for (const slug of [SLUG_A, SLUG_B]) {
    const existing = await platformPrisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      await platformPrisma.auditLog.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.registrationRenewal.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.fisherfolk.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.tenant.delete({ where: { id: existing.id } });
    }
  }

  const tenantA = await platformPrisma.tenant.create({
    data: { name: "Test Tenant A", slug: SLUG_A, status: "ACTIVE", currentRegistrationYear: new Date().getFullYear() },
  });
  testTenantAId = tenantA.id;

  const tenantB = await platformPrisma.tenant.create({
    data: { name: "Test Tenant B", slug: SLUG_B, status: "ACTIVE", currentRegistrationYear: new Date().getFullYear() },
  });
  testTenantBId = tenantB.id;

  const user = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `encoder-${RUN}@local`,
      username: `encoder-${RUN}`,
      passwordHash: "not-real",
      name: "Test Encoder",
      role: "encoder",
    },
  });
  testUserId = user.id;
});

afterAll(async () => {
  if (!hasDb) return;
  if (!testTenantAId || !testTenantBId) return;

  for (const tenantId of [testTenantAId, testTenantBId]) {
    await platformPrisma.auditLog.deleteMany({ where: { tenantId } });
    await platformPrisma.registrationRenewal.deleteMany({ where: { tenantId } });
    await platformPrisma.violation.deleteMany({ where: { tenantId } }).catch(() => {/* no violations */});
    await platformPrisma.fisherfolk.deleteMany({ where: { tenantId } });
    await platformPrisma.user.deleteMany({ where: { tenantId } });
    await platformPrisma.tenant.delete({ where: { id: tenantId } }).catch(() => {/* already gone */});
  }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("fisherfolk.renew", () => {
  it("blocks renew when fisherfolk status is not EXPIRED", async () => {
    // Default createTestFisherfolk produces NEW status — guard must reject
    const ff = await createTestFisherfolk(testTenantAId);
    await expect(
      caller(testTenantAId).renew({ id: ff.id }),
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: "Cannot renew: record must be EXPIRED before it can be renewed",
    });

    await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
  });

  it("allows renew when fisherfolk status is EXPIRED", async () => {
    const ff = await createTestFisherfolk(testTenantAId, { status: "EXPIRED" });

    const result = await caller(testTenantAId).renew({ id: ff.id });
    expect(result.status).toBe("RENEWED");

    // Clean up
    await platformPrisma.auditLog.deleteMany({ where: { entityId: ff.id } });
    await platformPrisma.registrationRenewal.deleteMany({ where: { fisherfolkId: ff.id } });
    await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
  });

  it("blocks renew when fisherfolk has an active violation", async () => {
    const ff = await createTestFisherfolk(testTenantAId, { status: "EXPIRED" });
    await platformPrisma.violation.create({
      data: {
        tenantId: testTenantAId,
        targetType: "FISHERFOLK",
        fisherfolkId: ff.id,
        subject: "Test Violation",
        status: "ACTIVE",
        filedById: testUserId,
      },
    });

    await expect(
      caller(testTenantAId).renew({ id: ff.id }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    // Clean up
    await platformPrisma.violation.deleteMany({ where: { fisherfolkId: ff.id } });
    await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
  });

  it("writes RegistrationRenewal row, flips status to RENEWED, and audits RENEW", async () => {
    const ff = await createTestFisherfolk(testTenantAId, { status: "EXPIRED" });
    const currentYear = new Date().getFullYear();

    const result = await caller(testTenantAId).renew({ id: ff.id, notes: "Annual renewal" });

    expect(result.status).toBe("RENEWED");
    expect(result.registrationYear).toBe(currentYear);

    const renewal = await platformPrisma.registrationRenewal.findFirst({
      where: { fisherfolkId: ff.id, tenantId: testTenantAId },
    });
    expect(renewal).not.toBeNull();
    expect(renewal!.renewalYear).toBe(currentYear);
    expect(renewal!.notes).toBe("Annual renewal");
    expect(renewal!.renewedById).toBe(testUserId);

    const auditLog = await platformPrisma.auditLog.findFirst({
      where: { entityId: ff.id, entityType: "Fisherfolk", action: "RENEW" },
    });
    expect(auditLog).not.toBeNull();
    expect(auditLog!.tenantId).toBe(testTenantAId);

    // Clean up
    await platformPrisma.auditLog.deleteMany({ where: { entityId: ff.id } });
    await platformPrisma.registrationRenewal.deleteMany({ where: { fisherfolkId: ff.id } });
    await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
  });
});

describe.skipIf(!hasDb)("fisherfolk.markIdReleased", () => {
  it("sets idReleasedAt and audits on first call, is a no-op on subsequent calls", async () => {
    const ff = await createTestFisherfolk(testTenantAId);

    // First call — sets the release
    const first = await caller(testTenantAId).markIdReleased({ id: ff.id });
    expect(first.idReleasedAt).not.toBeNull();
    expect(first.idReleasedById).toBe(testUserId);

    // Second call — idempotent, returns existing record
    const second = await caller(testTenantAId).markIdReleased({ id: ff.id });
    expect(second.idReleasedAt).not.toBeNull();

    // Only one audit log entry for this fisherfolk (the first call)
    const auditLogs = await platformPrisma.auditLog.findMany({
      where: { entityId: ff.id, entityType: "Fisherfolk", action: "UPDATE" },
    });
    expect(auditLogs).toHaveLength(1);

    // Clean up
    await platformPrisma.auditLog.deleteMany({ where: { entityId: ff.id } });
    await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
  });
});

describe.skipIf(!hasDb)("fisherfolk.getActivity", () => {
  it("returns sanitized activity (no before/after) and is tenant-scoped", async () => {
    const ff = await createTestFisherfolk(testTenantAId, { status: "EXPIRED" });

    // Trigger a RENEW so there's an audit log
    await caller(testTenantAId).renew({ id: ff.id });

    const activity = await caller(testTenantAId, "viewer").getActivity({ id: ff.id });

    expect(activity.length).toBeGreaterThan(0);
    const entry = activity[0]!;
    // Only sanitized fields present
    expect(entry).toHaveProperty("id");
    expect(entry).toHaveProperty("action");
    expect(entry).toHaveProperty("actorName");
    expect(entry).toHaveProperty("createdAt");
    // No raw diff fields
    expect(entry).not.toHaveProperty("before");
    expect(entry).not.toHaveProperty("after");
    expect(entry).not.toHaveProperty("userId");

    // Cross-tenant: tenant B caller cannot see tenant A's fisherfolk activity
    await expect(
      caller(testTenantBId, "viewer").getActivity({ id: ff.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    // Clean up
    await platformPrisma.auditLog.deleteMany({ where: { entityId: ff.id } });
    await platformPrisma.registrationRenewal.deleteMany({ where: { fisherfolkId: ff.id } });
    await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
  });
});

describe.skipIf(!hasDb)("fisherfolk.renewalDue (FIS-15, reminder-only)", () => {
  it("counts only NEW/RENEWED fisherfolk whose anchor year is 3+ years old, and the list filter matches the same set", async () => {
    const currentYear = new Date().getFullYear();

    // Due: NEW, registered 4 years ago, never renewed.
    const due = await createTestFisherfolk(testTenantAId, {
      status: "NEW",
      registrationYear: currentYear - 4,
    });
    // Not due: NEW, registered this year.
    const notDue = await createTestFisherfolk(testTenantAId, {
      status: "NEW",
      registrationYear: currentYear,
    });
    // Not due: RENEWED last year via a RegistrationRenewal row (anchor year
    // moves forward even though registrationYear is stale).
    const renewedRecently = await createTestFisherfolk(testTenantAId, {
      status: "RENEWED",
      registrationYear: currentYear - 5,
    });
    await platformPrisma.registrationRenewal.create({
      data: {
        tenantId: testTenantAId,
        fisherfolkId: renewedRecently.id,
        renewalYear: currentYear - 1,
        renewedById: testUserId,
      },
    });
    // Excluded despite an overdue anchor year: already EXPIRED.
    const expired = await createTestFisherfolk(testTenantAId, {
      status: "EXPIRED",
      registrationYear: currentYear - 6,
    });

    const before = await caller(testTenantAId, "viewer").renewalDue();

    const list = await caller(testTenantAId, "viewer").list({
      page: 1,
      limit: 200,
      dueForRenewal: true,
    });
    const listIds = list.items.map((i) => i.id);

    expect(listIds).toContain(due.id);
    expect(listIds).not.toContain(notDue.id);
    expect(listIds).not.toContain(renewedRecently.id);
    expect(listIds).not.toContain(expired.id);
    expect(before.count).toBe(listIds.length);

    // Cross-tenant: tenant B sees none of tenant A's due fisherfolk.
    const crossTenant = await caller(testTenantBId, "viewer").renewalDue();
    expect(crossTenant.count).toBe(0);

    // Clean up
    await platformPrisma.registrationRenewal.deleteMany({
      where: { fisherfolkId: renewedRecently.id },
    });
    await platformPrisma.fisherfolk.deleteMany({
      where: { id: { in: [due.id, notDue.id, renewedRecently.id, expired.id] } },
    });
  });
});

describe.skipIf(!hasDb)("cross-tenant isolation", () => {
  it("renew and markIdReleased deny access to fisherfolk from another tenant", async () => {
    const ff = await createTestFisherfolk(testTenantAId);

    // Tenant B caller tries to act on tenant A's fisherfolk
    await expect(
      caller(testTenantBId).renew({ id: ff.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      caller(testTenantBId).markIdReleased({ id: ff.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    // Clean up
    await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
  });
});
