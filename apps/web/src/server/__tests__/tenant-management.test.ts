/**
 * Integration tests — Platform Tenant Management backend
 *
 * Covers `tenant.create` and `tenant.setStatus` (both superAdminProcedure).
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
 *   pnpm -C apps/web exec vitest run src/server/__tests__/tenant-management.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import type { Session } from "next-auth";

// platformPrisma: unguarded PrismaClient — bypasses the tenantGuardExtension.
// Required for super_admin operations that have no tenant ALS context.
import { platformPrisma } from "@frms/db";
import type { ExtendedPrismaClient } from "@frms/db";

import type { TRPCContext } from "../trpc/context";
import { tenantRouter } from "../trpc/routers/tenant";
import { createCallerFactory } from "../trpc/trpc";

// ─── Caller factory ─────────────────────────────────────────────────────────

/**
 * Resolved in beforeAll from the real DB — auditLog.userId FK must reference a
 * row in `users`. Using a fake UUID would violate `audit_logs_user_id_fkey`.
 * Queried dynamically so the tests survive a DB reset / re-seed.
 */
let superAdminId: string;

beforeAll(async () => {
  const sa = await platformPrisma.user.findFirstOrThrow({
    where: { role: "super_admin" },
    select: { id: true },
  });
  superAdminId = sa.id;
});

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

const callerFactory = createCallerFactory(tenantRouter);
/** Fresh caller per invocation to avoid cross-test context state. */
const caller = () => callerFactory(makeCtx());

// ─── Unique IDs per test run ────────────────────────────────────────────────

/** Suffix unique to this Vitest run — prevents collisions in a shared dev DB. */
const RUN = Date.now().toString(36);
const mkSlug = (tag: string) => `test-${tag}-${RUN}`;
const mkUser = (tag: string) => `usr-${tag}-${RUN}`;

// ─── Cleanup ─────────────────────────────────────────────────────────────────

const createdTenantIds: string[] = [];

afterAll(async () => {
  // Delete child rows before tenant (FK order).
  // Use platformPrisma — User is a tenant-scoped model and would throw under
  // the guarded client without an ALS context.
  for (const id of createdTenantIds) {
    await platformPrisma.auditLog.deleteMany({ where: { tenantId: id } });
    await platformPrisma.user.deleteMany({ where: { tenantId: id } });
    await platformPrisma.tenant.delete({ where: { id } }).catch(() => {
      /* already cleaned up */
    });
  }
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("tenant.create", () => {
  it("happy path — returns ACTIVE tenant, persists Tenant row + admin User row with hashed password", async () => {
    const c = caller();
    const tenantSlug = mkSlug("happy");
    const adminUsername = mkUser("happy");
    const password = "SecurePassw0rd!xYz";

    const result = await c.create({
      name: "Test Happy Tenant",
      slug: tenantSlug,
      admin: {
        username: adminUsername,
        fullName: "Happy Admin",
        password,
      },
    });

    createdTenantIds.push(result.id);

    // ── Return shape ──────────────────────────────────────────────────────
    expect(result.id).toBeTruthy();
    expect(result.slug).toBe(tenantSlug);
    expect(result.name).toBe("Test Happy Tenant");
    expect(result.status).toBe("ACTIVE");

    // ── Tenant row persisted ──────────────────────────────────────────────
    const tenant = await platformPrisma.tenant.findUnique({
      where: { id: result.id },
    });
    expect(tenant).not.toBeNull();
    expect(tenant!.status).toBe("ACTIVE");
    expect(tenant!.slug).toBe(tenantSlug);

    // ── Admin User row persisted (correct role / status / tenantId / email) ──
    // Must use platformPrisma: User is tenant-scoped and requires ALS context.
    const user = await platformPrisma.user.findFirst({
      where: { tenantId: result.id },
    });
    expect(user).not.toBeNull();
    expect(user!.username).toBe(adminUsername);
    expect(user!.role).toBe("admin");
    expect(user!.status).toBe("ACTIVE");
    expect(user!.tenantId).toBe(result.id);
    expect(user!.email).toBe(`${adminUsername}@${tenantSlug}.local`);

    // ── Password is bcrypt-hashed, never stored as plaintext ─────────────
    const passwordMatches = await bcrypt.compare(password, user!.passwordHash);
    expect(passwordMatches).toBe(true);
  });

  it("duplicate slug → TRPCError CONFLICT", async () => {
    const c = caller();
    const tenantSlug = mkSlug("dupslug");

    // First creation succeeds
    const first = await c.create({
      name: "Dup Slug Tenant A",
      slug: tenantSlug,
      admin: {
        username: mkUser("dupslug-a"),
        fullName: "Admin A",
        password: "SecurePassw0rd!xYz",
      },
    });
    createdTenantIds.push(first.id);

    // Second creation with same slug → CONFLICT
    await expect(
      c.create({
        name: "Dup Slug Tenant B",
        slug: tenantSlug,
        admin: {
          username: mkUser("dupslug-b"),
          fullName: "Admin B",
          password: "SecurePassw0rd!xYz",
        },
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("duplicate username → TRPCError CONFLICT", async () => {
    const c = caller();
    const sharedUsername = mkUser("dupuser");

    // First creation succeeds
    const first = await c.create({
      name: "Dup User Tenant A",
      slug: mkSlug("dupuser-a"),
      admin: {
        username: sharedUsername,
        fullName: "Admin Shared",
        password: "SecurePassw0rd!xYz",
      },
    });
    createdTenantIds.push(first.id);

    // Second creation with same username (different slug) → CONFLICT
    await expect(
      c.create({
        name: "Dup User Tenant B",
        slug: mkSlug("dupuser-b"),
        admin: {
          username: sharedUsername,
          fullName: "Admin Shared 2",
          password: "SecurePassw0rd!xYz",
        },
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("tenant.setStatus", () => {
  it("suspend then reactivate — status transitions are persisted correctly", async () => {
    const c = caller();

    // Create a tenant to operate on (status ACTIVE on creation)
    const created = await c.create({
      name: "Status Toggle Tenant",
      slug: mkSlug("status"),
      admin: {
        username: mkUser("status"),
        fullName: "Status Admin",
        password: "SecurePassw0rd!xYz",
      },
    });
    createdTenantIds.push(created.id);
    expect(created.status).toBe("ACTIVE");

    // ── Suspend ───────────────────────────────────────────────────────────
    const suspended = await c.setStatus({
      id: created.id,
      status: "SUSPENDED",
    });
    expect(suspended.id).toBe(created.id);
    expect(suspended.status).toBe("SUSPENDED");

    // Verify persisted in DB
    const dbAfterSuspend = await platformPrisma.tenant.findUnique({
      where: { id: created.id },
    });
    expect(dbAfterSuspend!.status).toBe("SUSPENDED");

    // ── Reactivate ────────────────────────────────────────────────────────
    const reactivated = await c.setStatus({
      id: created.id,
      status: "ACTIVE",
    });
    expect(reactivated.status).toBe("ACTIVE");

    // Verify persisted in DB
    const dbAfterReactivate = await platformPrisma.tenant.findUnique({
      where: { id: created.id },
    });
    expect(dbAfterReactivate!.status).toBe("ACTIVE");
  });

  it("non-existent tenant id → TRPCError NOT_FOUND", async () => {
    const c = caller();
    await expect(
      c.setStatus({ id: "nonexistent-tenant-id-zzz999", status: "SUSPENDED" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
