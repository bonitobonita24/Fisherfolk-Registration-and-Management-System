/**
 * Integration tests — Tenant Succession mutations
 *
 * Covers `tenant.reassignOwner` (tenantManagerProcedure, platform break-glass
 * reassignment) and `user.transferOwnership` (tenantSuperadminProcedure,
 * in-tenant owner-to-owner transfer). Both mutations enforce the
 * `one_tenant_superadmin_per_tenant` partial-unique index (demote-then-promote
 * ordering inside a single $transaction).
 *
 * Why platformPrisma for reassignOwner's ctx.db / all setup+assertions
 * ─────────────────────────────────────────────────────────────────────
 * tenant_manager has tenantId=null, so protectedProcedure skips runWithTenant —
 * the guarded `prisma` client would throw "Tenant context not set". Mirrors
 * tenant-user-management.test.ts's documented pattern.
 *
 * Why the GUARDED `prisma` for transferOwnership's ctx.db
 * ─────────────────────────────────────────────────────────
 * tenant_superadmin has a real tenantId, so protectedProcedure DOES call
 * runWithTenant — the production ctx.db is the guarded client. The owner
 * caller must use the same guarded client so the test exercises the real
 * code path (tenantGuardExtension active).
 *
 * Why a fresh tenant per mutating test
 * ─────────────────────────────────────
 * A tenant can hold at most ONE ACTIVE tenant_superadmin at a time (DB partial-
 * unique index). Running multiple ownership-mutating tests against a shared
 * tenant would require careful sequencing; a dedicated throwaway tenant per
 * mutating test keeps each test's owner/candidate state fully isolated and
 * trivially satisfies the index.
 *
 * DB: DATABASE_URL from .env.dev (repo root). Run via:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/__tests__/tenant-succession.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

// platformPrisma: unguarded PrismaClient — bypasses the tenantGuardExtension.
// Required for tenant_manager (platform) operations that have no tenant ALS
// context, and for all setup/assertion queries in this file.
import { platformPrisma, prisma } from "@frms/db";
import type { ExtendedPrismaClient } from "@frms/db";

import type { TRPCContext } from "../trpc/context";
import { tenantRouter } from "../trpc/routers/tenant";
import { userRouter } from "../trpc/routers/user";
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
const DEFAULT_PASSWORD_HASH =
  // Fixed bcrypt hash — never verified in these tests (succession mutations
  // never check passwords), so a static value is sufficient and avoids a
  // real bcrypt.hash() call per user.
  "$2a$12$KIXQ8Z8Z8Z8Z8Z8Z8Z8Z8uQwQwQwQwQwQwQwQwQwQwQwQwQwQwQw";

// Monotonic counter so each mkUsername() call is unique within the run.
let _userCounter = 0;
const mkUsername = (tag: string) => `succ-${RUN}-${tag}-${++_userCounter}`;

// Monotonic counter so each mkTenant() call has a unique slug within the run.
let _tenantCounter = 0;

// ─── Shared state ─────────────────────────────────────────────────────────────

/**
 * Resolved in beforeAll from the real DB — auditLog.userId FK must reference a
 * row in `users`. Using a fake UUID would violate `audit_logs_user_id_fkey`.
 * Queried dynamically so the tests survive a DB reset / re-seed.
 */
let superAdminId: string;

/** All throwaway tenant ids created across the whole file — cleaned up in afterAll. */
const createdTenantIds: string[] = [];

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  const sa = await platformPrisma.user.findFirstOrThrow({
    where: { role: "tenant_manager" },
    select: { id: true },
  });
  superAdminId = sa.id;
});

afterAll(async () => {
  if (!hasDb) return;
  for (const tenantId of createdTenantIds) {
    await platformPrisma.auditLog.deleteMany({ where: { tenantId } });
    await platformPrisma.user.deleteMany({ where: { tenantId } });
    await platformPrisma.tenant.delete({ where: { id: tenantId } }).catch(() => {
      /* already cleaned up */
    });
  }
});

// ─── Tenant + user fixtures ────────────────────────────────────────────────────

/**
 * Creates a throwaway tenant (registered for afterAll cleanup) plus an ACTIVE
 * owner (tenant_superadmin) and an ACTIVE candidate (tenant_admin). Returns
 * their ids so each test can build the exact ownership state it asserts on.
 */
async function mkTenantWithOwnerAndCandidate() {
  const slug = `succ-test-${RUN}-${++_tenantCounter}`;
  const tenant = await platformPrisma.tenant.create({
    data: {
      name: `Succession Test Tenant ${_tenantCounter}`,
      slug,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  createdTenantIds.push(tenant.id);

  const owner = await platformPrisma.user.create({
    data: {
      username: mkUsername("owner"),
      email: `${mkUsername("owner-email")}@${slug}.local`,
      name: "Owner User",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "tenant_superadmin",
      status: "ACTIVE",
      tenantId: tenant.id,
    },
  });

  const candidate = await platformPrisma.user.create({
    data: {
      username: mkUsername("candidate"),
      email: `${mkUsername("candidate-email")}@${slug}.local`,
      name: "Candidate User",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "tenant_admin",
      status: "ACTIVE",
      tenantId: tenant.id,
    },
  });

  return { tenantId: tenant.id, ownerId: owner.id, candidateId: candidate.id };
}

/** Creates an extra ACTIVE tenant_admin candidate within an existing tenant. */
async function mkCandidate(tenantId: string, role: "tenant_admin" = "tenant_admin") {
  const user = await platformPrisma.user.create({
    data: {
      username: mkUsername("extra"),
      email: `${mkUsername("extra-email")}@extra.local`,
      name: "Extra Candidate",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role,
      status: "ACTIVE",
      tenantId,
    },
  });
  return user.id;
}

/** Creates a DEACTIVATED tenant_admin candidate within an existing tenant. */
async function mkDeactivatedCandidate(tenantId: string) {
  const user = await platformPrisma.user.create({
    data: {
      username: mkUsername("deact"),
      email: `${mkUsername("deact-email")}@deact.local`,
      name: "Deactivated Candidate",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "tenant_admin",
      status: "DEACTIVATED",
      tenantId,
    },
  });
  return user.id;
}

// ─── Context + caller helpers ─────────────────────────────────────────────────

/**
 * Builds a TRPCContext for `tenant.reassignOwner` (tenantManagerProcedure):
 *   • role === "tenant_manager", tenantId === null (platform, no ALS context)
 *   • db = platformPrisma (unguarded — see module-level comment)
 */
function makePlatformCtx(): TRPCContext {
  return {
    session: {
      user: { id: superAdminId, name: "SA Test", email: "sa-test@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId: superAdminId,
    role: "tenant_manager",
    tenantId: null,
    tenantSlug: null,
    db: platformPrisma as unknown as ExtendedPrismaClient,
    req: new Request("http://localhost/api/trpc"),
  };
}

/**
 * Builds a TRPCContext for `user.transferOwnership` (tenantSuperadminProcedure):
 *   • role param (default "tenant_superadmin") + tenantId = the owner's tenant
 *   • db = the GUARDED `prisma` client — production parity, since
 *     protectedProcedure DOES run runWithTenant for a non-null tenantId.
 */
function makeTenantCtx(
  tenantId: string,
  userId: string,
  role: "tenant_superadmin" | "tenant_admin" = "tenant_superadmin",
): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Owner Test", email: "owner-test@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId,
    role,
    tenantId,
    tenantSlug: null,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const platformCallerFactory = createCallerFactory(tenantRouter);
/** Fresh platform caller per invocation to avoid cross-test context state. */
const platformCaller = () => platformCallerFactory(makePlatformCtx());

const userCallerFactory = createCallerFactory(userRouter);
/**
 * Fresh tenant-owner caller for the given tenant/user/role. A fresh instance
 * is required per call because transferOwnership demotes the current owner —
 * the owner userId a test asserts on changes after a successful transfer.
 */
const tenantOwnerCaller = (
  tenantId: string,
  userId: string,
  role: "tenant_superadmin" | "tenant_admin" = "tenant_superadmin",
) => userCallerFactory(makeTenantCtx(tenantId, userId, role));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("tenant.reassignOwner", () => {
  it("happy path — demotes current owner, promotes candidate, writes audit row", async () => {
    const { tenantId, ownerId, candidateId } = await mkTenantWithOwnerAndCandidate();
    const c = platformCaller();

    const result = await c.reassignOwner({ tenantId, newOwnerId: candidateId });

    expect(result.previousOwnerId).toBe(ownerId);
    expect(result.newOwnerId).toBe(candidateId);
    expect(result.tenantId).toBe(tenantId);

    const [ownerAfter, candidateAfter] = await Promise.all([
      platformPrisma.user.findUniqueOrThrow({
        where: { id: ownerId },
        select: { role: true, securityVersion: true },
      }),
      platformPrisma.user.findUniqueOrThrow({
        where: { id: candidateId },
        select: { role: true, securityVersion: true },
      }),
    ]);

    expect(candidateAfter.role).toBe("tenant_superadmin");
    expect(ownerAfter.role).toBe("tenant_admin");
    // securityVersion defaults to 1 (schema @default(1)) — incremented by 1.
    expect(ownerAfter.securityVersion).toBe(2);
    expect(candidateAfter.securityVersion).toBe(2);

    const ownerCount = await platformPrisma.user.count({
      where: { tenantId, role: "tenant_superadmin" },
    });
    expect(ownerCount).toBe(1);

    const audit = await platformPrisma.auditLog.findFirst({
      where: { tenantId, entityType: "User", entityId: candidateId },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).toBeTruthy();
    expect((audit?.after as Record<string, unknown> | null)?.reassignedOwner).toBe(
      true,
    );
  });

  it("unknown tenantId → TRPCError NOT_FOUND", async () => {
    const { candidateId } = await mkTenantWithOwnerAndCandidate();
    const c = platformCaller();

    await expect(
      c.reassignOwner({
        tenantId: "czzzzzzzzzzzzzzzzzzzzzzzzz",
        newOwnerId: candidateId,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("newOwnerId not in tenant → TRPCError NOT_FOUND", async () => {
    const { tenantId } = await mkTenantWithOwnerAndCandidate();
    const c = platformCaller();

    await expect(
      c.reassignOwner({
        tenantId,
        newOwnerId: "czzzzzzzzzzzzzzzzzzzzzzzzz",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("newOwner already tenant_superadmin → TRPCError BAD_REQUEST", async () => {
    const { tenantId, ownerId } = await mkTenantWithOwnerAndCandidate();
    const c = platformCaller();

    await expect(
      c.reassignOwner({ tenantId, newOwnerId: ownerId }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "User is already the tenant owner.",
    });
  });

  it("deactivated candidate → TRPCError BAD_REQUEST", async () => {
    const { tenantId } = await mkTenantWithOwnerAndCandidate();
    const deactivatedId = await mkDeactivatedCandidate(tenantId);
    const c = platformCaller();

    await expect(
      c.reassignOwner({ tenantId, newOwnerId: deactivatedId }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Cannot assign a deactivated user as owner.",
    });
  });
});

describe.skipIf(!hasDb)("user.transferOwnership", () => {
  it("happy path — demotes self, promotes candidate, writes audit row", async () => {
    const { tenantId, ownerId, candidateId } = await mkTenantWithOwnerAndCandidate();
    const c = tenantOwnerCaller(tenantId, ownerId);

    const result = await c.transferOwnership({ newOwnerId: candidateId });

    expect(result.previousOwnerId).toBe(ownerId);
    expect(result.newOwnerId).toBe(candidateId);

    const [ownerAfter, candidateAfter] = await Promise.all([
      platformPrisma.user.findUniqueOrThrow({
        where: { id: ownerId },
        select: { role: true, securityVersion: true },
      }),
      platformPrisma.user.findUniqueOrThrow({
        where: { id: candidateId },
        select: { role: true, securityVersion: true },
      }),
    ]);

    expect(candidateAfter.role).toBe("tenant_superadmin");
    expect(ownerAfter.role).toBe("tenant_admin");
    // securityVersion defaults to 1 (schema @default(1)) — incremented by 1.
    expect(ownerAfter.securityVersion).toBe(2);
    expect(candidateAfter.securityVersion).toBe(2);

    const ownerCount = await platformPrisma.user.count({
      where: { tenantId, role: "tenant_superadmin" },
    });
    expect(ownerCount).toBe(1);

    const audit = await platformPrisma.auditLog.findFirst({
      where: { tenantId, entityType: "User", entityId: candidateId },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).toBeTruthy();
    expect(
      (audit?.after as Record<string, unknown> | null)?.transferredOwnership,
    ).toBe(true);
  });

  it("transfer to self → TRPCError BAD_REQUEST", async () => {
    const { tenantId, ownerId } = await mkTenantWithOwnerAndCandidate();
    const c = tenantOwnerCaller(tenantId, ownerId);

    await expect(
      c.transferOwnership({ newOwnerId: ownerId }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "You are already the owner.",
    });
  });

  it("transfer to deactivated candidate → TRPCError BAD_REQUEST", async () => {
    const { tenantId, ownerId } = await mkTenantWithOwnerAndCandidate();
    const deactivatedId = await mkDeactivatedCandidate(tenantId);
    const c = tenantOwnerCaller(tenantId, ownerId);

    await expect(
      c.transferOwnership({ newOwnerId: deactivatedId }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Cannot transfer ownership to a deactivated user.",
    });
  });

  it("unknown newOwnerId → TRPCError NOT_FOUND", async () => {
    const { tenantId, ownerId } = await mkTenantWithOwnerAndCandidate();
    const c = tenantOwnerCaller(tenantId, ownerId);

    await expect(
      c.transferOwnership({ newOwnerId: "czzzzzzzzzzzzzzzzzzzzzzzzz" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("caller role not tenant_superadmin → TRPCError FORBIDDEN", async () => {
    const { tenantId, candidateId } = await mkTenantWithOwnerAndCandidate();
    // ctx.role "tenant_admin" is rejected by tenantSuperadminProcedure's
    // requireRole("tenant_manager", "tenant_superadmin") middleware before the
    // handler's own explicit ctx.role check ever runs — either way, FORBIDDEN.
    const c = tenantOwnerCaller(tenantId, candidateId, "tenant_admin");

    await expect(
      c.transferOwnership({ newOwnerId: candidateId }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("invariant — exactly one tenant_superadmin remains after a happy transfer", async () => {
    const { tenantId, ownerId, candidateId } = await mkTenantWithOwnerAndCandidate();
    const extraId = await mkCandidate(tenantId);
    const c = tenantOwnerCaller(tenantId, ownerId);

    await c.transferOwnership({ newOwnerId: candidateId });

    const ownerCount = await platformPrisma.user.count({
      where: { tenantId, role: "tenant_superadmin" },
    });
    expect(ownerCount).toBe(1);
    // Sanity: the untouched extra candidate keeps its original role.
    const extraAfter = await platformPrisma.user.findUniqueOrThrow({
      where: { id: extraId },
      select: { role: true },
    });
    expect(extraAfter.role).toBe("tenant_admin");
  });
});
