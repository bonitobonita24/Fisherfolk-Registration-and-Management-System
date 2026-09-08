/**
 * Integration tests — violation tRPC router: create authorization (FIS-37c)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/__tests__/violation.test.ts
 *
 * Proves the owner decision (2026-09-08): `violation.create` is guarded by
 * matrixProcedure("violations","write") — the 3 fixed admin tiers and the
 * `bantay_dagat` enforcement role may FILE violations; `encoder`/`viewer`
 * remain denied by-default. Scope is CREATE only (update/lift unchanged).
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension);
 * prisma (guarded) as ctx.db so protectedProcedure's runWithTenant() ALS fires.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../../context";
import { violationRouter } from "../violation";
import { createCallerFactory } from "../../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);
const dbDescribe = hasDb ? describe : describe.skip;

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG = `viol-test-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantId: string;
let testUserId: string;
let targetFisherfolkId: string;

type TestRole =
  | "tenant_manager"
  | "tenant_superadmin"
  | "tenant_admin"
  | "encoder"
  | "viewer"
  | "bantay_dagat";

function makeCtx(role: TestRole): TRPCContext {
  return {
    session: {
      user: { id: testUserId, name: "Test User", email: "user@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId: testUserId,
    role,
    tenantId: testTenantId,
    tenantSlug: SLUG,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(violationRouter);
const caller = (role: TestRole) => callerFactory(makeCtx(role));

const createInput = () => ({
  targetType: "FISHERFOLK" as const,
  fisherfolkId: targetFisherfolkId,
  subject: "Illegal fishing gear",
});

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  const existing = await platformPrisma.tenant.findUnique({ where: { slug: SLUG } });
  if (existing) {
    await platformPrisma.auditLog.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.violation.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.fisherfolk.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.tenant.delete({ where: { id: existing.id } });
  }

  const tenant = await platformPrisma.tenant.create({
    data: {
      name: "Violation Authz Test",
      slug: SLUG,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantId = tenant.id;

  const user = await platformPrisma.user.create({
    data: {
      tenantId: testTenantId,
      email: `user-${RUN}@local`,
      username: `user-${RUN}`,
      passwordHash: "not-real",
      name: "Test User",
      role: "bantay_dagat",
    },
  });
  testUserId = user.id;

  const ff = await platformPrisma.fisherfolk.create({
    data: {
      tenantId: testTenantId,
      idNumber: `FF-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
      fullName: "Target Fisher",
      lastName: "Fisher",
      firstName: "Target",
      address: "1 Wharf Rd",
      barangay: "Barangay Test",
      registrationYear: new Date().getFullYear(),
      createdById: testUserId,
      updatedById: testUserId,
    },
  });
  targetFisherfolkId = ff.id;
});

afterAll(async () => {
  if (!hasDb || !testTenantId) return;
  await platformPrisma.auditLog.deleteMany({ where: { tenantId: testTenantId } });
  await platformPrisma.violation.deleteMany({ where: { tenantId: testTenantId } });
  await platformPrisma.fisherfolk.deleteMany({ where: { tenantId: testTenantId } });
  await platformPrisma.user.deleteMany({ where: { tenantId: testTenantId } });
  await platformPrisma.tenant.delete({ where: { id: testTenantId } });
});

// ─── Tests ─────────────────────────────────────────────────────────────────

dbDescribe("violation.create authorization (FIS-37c)", () => {
  it("allows bantay_dagat to file a violation (and writes a CREATE audit row)", async () => {
    const record = await caller("bantay_dagat").create(createInput());
    expect(record.id).toBeTruthy();
    expect(record.subject).toBe("Illegal fishing gear");
    expect(record.filedById).toBe(testUserId);

    const audit = await platformPrisma.auditLog.findFirst({
      where: { tenantId: testTenantId, entityType: "Violation", entityId: record.id, action: "CREATE" },
    });
    expect(audit).not.toBeNull();
  });

  it("allows tenant_superadmin to file a violation", async () => {
    const record = await caller("tenant_superadmin").create(createInput());
    expect(record.id).toBeTruthy();
  });

  it("denies viewer (FORBIDDEN)", async () => {
    await expect(caller("viewer").create(createInput())).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("denies encoder (FORBIDDEN) — encoder is excluded from violations by the owner decision", async () => {
    await expect(caller("encoder").create(createInput())).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
