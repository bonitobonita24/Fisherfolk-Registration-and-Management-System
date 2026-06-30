/**
 * Integration tests — Platform Tenant User Management backend
 *
 * Covers `tenantUser.create`, `tenantUser.resetPassword`, `tenantUser.setStatus`,
 * and `tenantUser.list` (all superAdminProcedure, all use platformPrisma).
 *
 * Why platformPrisma for ctx.db and direct queries
 * ─────────────────────────────────────────────────
 * The `tenantGuardExtension` throws "Tenant context not set" for any
 * non-system model operation when no runWithTenant() ALS context is active.
 * super_admin has tenantId=null, so protectedProcedure skips runWithTenant —
 * meaning ctx.db (guarded `prisma`) would fail on `User.create` / `User.findFirst`.
 * trpc.ts explicitly notes: "those callers should use platformPrisma".
 * Tests use `platformPrisma as unknown as typeof prisma` to match the intended
 * production behaviour; type cast is documented and intentional.
 *
 * DB: DATABASE_URL from .env.dev (repo root). Run via:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/__tests__/tenant-user-management.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

// platformPrisma: unguarded PrismaClient — bypasses the tenantGuardExtension.
// Required for super_admin operations that have no tenant ALS context.
import { platformPrisma } from "@frms/db";
import type { ExtendedPrismaClient } from "@frms/db";

import type { TRPCContext } from "../trpc/context";
import { tenantUserRouter } from "../trpc/routers/tenantUser";
import { createCallerFactory } from "../trpc/trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

/**
 * These are DB-integration tests: they exercise the real procedures against a
 * live Postgres. CI runs without a database (the rest of the test suite is
 * pure-logic), so skip when DATABASE_URL is absent. Locally (DATABASE_URL from
 * .env.dev) they run and provide real coverage.
 */
const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique IDs per test run ─────────────────────────────────────────────────

/** Suffix unique to this Vitest run — prevents collisions in a shared dev DB. */
const RUN = Date.now().toString(36);
/** Throwaway tenant slug — cleaned up in beforeAll + afterAll. */
const TEST_SLUG = `tu-test-${RUN}`;
const DEFAULT_PASSWORD = "SecurePassw0rd!xYz";

// Monotonic counter so each mkUsername() call is unique within the run.
let _userCounter = 0;
const mkUsername = (tag: string) => `${TEST_SLUG}-${tag}-${++_userCounter}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

/**
 * Resolved in beforeAll from the real DB — auditLog.userId FK must reference a
 * row in `users`. Using a fake UUID would violate `audit_logs_user_id_fkey`.
 * Queried dynamically so the tests survive a DB reset / re-seed.
 */
let superAdminId: string;

/** The throwaway tenant created in beforeAll and torn down in afterAll. */
let testTenantId: string;

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  const sa = await platformPrisma.user.findFirstOrThrow({
    where: { role: "super_admin" },
    select: { id: true },
  });
  superAdminId = sa.id;

  // Clean up any leftover tenant from a previous failed run with the same slug
  // (can happen when the process was killed before afterAll ran).
  const existing = await platformPrisma.tenant.findUnique({
    where: { slug: TEST_SLUG },
  });
  if (existing) {
    await platformPrisma.auditLog.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.tenant.delete({ where: { id: existing.id } });
  }

  // Create the throwaway tenant directly via platformPrisma (no admin yet —
  // tenantUser.create tests will add users as needed).
  const tenant = await platformPrisma.tenant.create({
    data: {
      name: "Test Tenant for User Mgmt",
      slug: TEST_SLUG,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantId = tenant.id;
});

afterAll(async () => {
  if (!hasDb) return;
  // Guard: if beforeAll failed (e.g. schema mismatch), testTenantId is undefined.
  // Skipping with an undefined id would turn deleteMany into a full-table wipe
  // and hit FK violations on real production data.
  if (!testTenantId) return;

  // Delete child rows before tenant (FK order).
  // Use platformPrisma — User is a tenant-scoped model and would throw under
  // the guarded client without an ALS context.
  await platformPrisma.auditLog.deleteMany({ where: { tenantId: testTenantId } });
  await platformPrisma.user.deleteMany({ where: { tenantId: testTenantId } });
  await platformPrisma.tenant.delete({ where: { id: testTenantId } }).catch(() => {
    /* already cleaned up */
  });
});

// ─── Context + caller helpers ─────────────────────────────────────────────────

/**
 * Builds a TRPCContext that satisfies superAdminProcedure:
 *   • session + userId non-null  (enforceAuth)
 *   • role === "super_admin"     (requireRole)
 *   • tenantId === null          (super_admin has no tenant; protectedProcedure
 *                                 skips runWithTenant → no ALS context)
 *   • db = platformPrisma        (unguarded; see module-level comment)
 */
function makeCtx(): TRPCContext {
  return {
    session: {
      user: { id: superAdminId, name: "SA Test", email: "sa-test@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId: superAdminId,
    role: "super_admin",
    tenantId: null,
    tenantSlug: null,
    // Cast: platformPrisma is unguarded PrismaClient; ctx.db type is the extended
    // client. The cast is safe here because superAdminProcedure operations target
    // Tenant (system) + User (platform-managed) — no tenant-scoped query guard needed.
    db: platformPrisma as unknown as ExtendedPrismaClient,
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(tenantUserRouter);
/** Fresh caller per invocation to avoid cross-test context state. */
const caller = () => callerFactory(makeCtx());

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("tenantUser.create", () => {
  it("happy path — returns user with correct role/status ACTIVE; passwordHash not in result", async () => {
    const c = caller();
    const username = mkUsername("create-ok");

    const result = await c.create({
      tenantId: testTenantId,
      name: "Happy Encoder",
      username,
      role: "encoder",
      password: DEFAULT_PASSWORD,
    });

    expect(result.id).toBeTruthy();
    expect(result.username).toBe(username);
    expect(result.name).toBe("Happy Encoder");
    expect(result.role).toBe("encoder");
    expect(result.status).toBe("ACTIVE");
    expect(result.email).toBe(`${username}@${TEST_SLUG}.local`);
    // The procedure selects specific fields — passwordHash must never be returned.
    expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it("duplicate username → TRPCError CONFLICT", async () => {
    const c = caller();
    const username = mkUsername("dup-user");

    // First creation succeeds
    await c.create({
      tenantId: testTenantId,
      name: "Dup User First",
      username,
      role: "viewer",
      password: DEFAULT_PASSWORD,
    });

    // Second with the same username → CONFLICT (username is globally unique)
    await expect(
      c.create({
        tenantId: testTenantId,
        name: "Dup User Second",
        username,
        role: "encoder",
        password: DEFAULT_PASSWORD,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("unknown tenantId (non-existent cuid) → TRPCError NOT_FOUND", async () => {
    const c = caller();
    // czzzzzzzzzzzzzzzzzzzzzzzzz satisfies z.string().cuid() (starts with 'c', ≥9 chars,
    // no spaces/dashes) but will not match any real row in the DB.
    await expect(
      c.create({
        tenantId: "czzzzzzzzzzzzzzzzzzzzzzzzz",
        name: "Ghost User",
        username: mkUsername("ghost"),
        role: "encoder",
        password: DEFAULT_PASSWORD,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe.skipIf(!hasDb)("tenantUser.resetPassword", () => {
  it("changes passwordHash and increments securityVersion", async () => {
    const c = caller();

    const created = await c.create({
      tenantId: testTenantId,
      name: "Reset PW User",
      username: mkUsername("reset-pw"),
      role: "encoder",
      password: DEFAULT_PASSWORD,
    });

    // Capture DB state BEFORE reset
    const before = await platformPrisma.user.findUniqueOrThrow({
      where: { id: created.id },
      select: { passwordHash: true, securityVersion: true },
    });

    const resetResult = await c.resetPassword({
      tenantId: testTenantId,
      userId: created.id,
      newPassword: "NewSecurePassw0rd!xYz99",
    });

    expect(resetResult.id).toBe(created.id);

    // Verify DB state AFTER reset
    const after = await platformPrisma.user.findUniqueOrThrow({
      where: { id: created.id },
      select: { passwordHash: true, securityVersion: true },
    });

    expect(after.passwordHash).not.toBe(before.passwordHash);
    expect(after.securityVersion).toBe(before.securityVersion + 1);
  });
});

describe.skipIf(!hasDb)("tenantUser.setStatus", () => {
  it("DEACTIVATED then ACTIVE round-trips on a non-admin user; securityVersion bumps each time", async () => {
    const c = caller();

    const created = await c.create({
      tenantId: testTenantId,
      name: "Status Encoder",
      username: mkUsername("set-status-enc"),
      role: "encoder",
      password: DEFAULT_PASSWORD,
    });
    expect(created.status).toBe("ACTIVE");

    const verBefore = (
      await platformPrisma.user.findUniqueOrThrow({
        where: { id: created.id },
        select: { securityVersion: true },
      })
    ).securityVersion;

    // ── Deactivate ─────────────────────────────────────────────────────────
    const deactivated = await c.setStatus({
      tenantId: testTenantId,
      userId: created.id,
      status: "DEACTIVATED",
    });
    expect(deactivated.id).toBe(created.id);
    expect(deactivated.status).toBe("DEACTIVATED");

    const verAfterDeactivate = (
      await platformPrisma.user.findUniqueOrThrow({
        where: { id: created.id },
        select: { securityVersion: true },
      })
    ).securityVersion;
    expect(verAfterDeactivate).toBe(verBefore + 1);

    // ── Reactivate ─────────────────────────────────────────────────────────
    const reactivated = await c.setStatus({
      tenantId: testTenantId,
      userId: created.id,
      status: "ACTIVE",
    });
    expect(reactivated.status).toBe("ACTIVE");

    const verAfterReactivate = (
      await platformPrisma.user.findUniqueOrThrow({
        where: { id: created.id },
        select: { securityVersion: true },
      })
    ).securityVersion;
    expect(verAfterReactivate).toBe(verBefore + 2);
  });

  it("DEACTIVATED on the only active admin → TRPCError BAD_REQUEST", async () => {
    const c = caller();

    // The throwaway tenant has no admins yet (created via platformPrisma without
    // an admin row). Create exactly one admin and immediately try to deactivate.
    const admin = await c.create({
      tenantId: testTenantId,
      name: "Only Active Admin",
      username: mkUsername("only-admin"),
      role: "admin",
      password: DEFAULT_PASSWORD,
    });

    await expect(
      c.setStatus({
        tenantId: testTenantId,
        userId: admin.id,
        status: "DEACTIVATED",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Cannot deactivate the only active admin.",
    });
  });
});

describe.skipIf(!hasDb)("tenantUser.list", () => {
  it("returns items with correct total and tenant meta { id, name, slug }", async () => {
    const c = caller();

    // Seed a known set of users for this list test
    const enc1 = await c.create({
      tenantId: testTenantId,
      name: "List Encoder One",
      username: mkUsername("list-enc1"),
      role: "encoder",
      password: DEFAULT_PASSWORD,
    });
    const enc2 = await c.create({
      tenantId: testTenantId,
      name: "List Encoder Two",
      username: mkUsername("list-enc2"),
      role: "encoder",
      password: DEFAULT_PASSWORD,
    });
    const viewerUser = await c.create({
      tenantId: testTenantId,
      name: "List Viewer",
      username: mkUsername("list-viewer"),
      role: "viewer",
      password: DEFAULT_PASSWORD,
    });

    const result = await c.list({ tenantId: testTenantId, limit: 100 });

    // Tenant meta must be returned correctly
    expect(result.tenant.id).toBe(testTenantId);
    expect(result.tenant.name).toBe("Test Tenant for User Mgmt");
    expect(result.tenant.slug).toBe(TEST_SLUG);

    // Total must account for all seeded users across the whole test suite
    expect(result.total).toBeGreaterThanOrEqual(3);

    const ids = result.items.map((u) => u.id);
    expect(ids).toContain(enc1.id);
    expect(ids).toContain(enc2.id);
    expect(ids).toContain(viewerUser.id);
  });

  it("role filter — only returns users with the requested role", async () => {
    const c = caller();

    const result = await c.list({
      tenantId: testTenantId,
      role: "viewer",
      limit: 100,
    });

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    for (const item of result.items) {
      expect(item.role).toBe("viewer");
    }
  });

  it("status filter — only returns DEACTIVATED users when requested", async () => {
    const c = caller();

    // Deactivate a fresh encoder so we have at least one DEACTIVATED user
    const enc = await c.create({
      tenantId: testTenantId,
      name: "Deactivated Filter Enc",
      username: mkUsername("list-deact"),
      role: "encoder",
      password: DEFAULT_PASSWORD,
    });
    await c.setStatus({
      tenantId: testTenantId,
      userId: enc.id,
      status: "DEACTIVATED",
    });

    const result = await c.list({
      tenantId: testTenantId,
      status: "DEACTIVATED",
      limit: 100,
    });

    expect(result.items.length).toBeGreaterThanOrEqual(1);
    for (const item of result.items) {
      expect(item.status).toBe("DEACTIVATED");
    }
    expect(result.items.map((u) => u.id)).toContain(enc.id);
  });

  it("search filter — matches by name substring (case-insensitive)", async () => {
    const c = caller();

    // Unique name guaranteed not to collide with other test users
    const uniqueName = `SearchTarget-${RUN}`;
    const found = await c.create({
      tenantId: testTenantId,
      name: uniqueName,
      username: mkUsername("list-search"),
      role: "bantay_dagat",
      password: DEFAULT_PASSWORD,
    });

    const result = await c.list({
      tenantId: testTenantId,
      search: uniqueName.toLowerCase(),
      limit: 100,
    });

    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.items.map((u) => u.id)).toContain(found.id);
  });

  it("unknown tenantId → TRPCError NOT_FOUND", async () => {
    const c = caller();
    await expect(
      c.list({ tenantId: "czzzzzzzzzzzzzzzzzzzzzzzzz" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
