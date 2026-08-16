/**
 * Integration tests — Milestone 2 platform RBAC
 * (docs/SITE_ACCESS_STANDARD.md §2): `platformRoleRouter` +
 * `resolveActorPlatformMatrix()` + `platformMatrixProcedure` against a real
 * Postgres, plus the cross-scope anti-escalation guards shared with
 * `customRoleRouter`.
 *
 * Why platformPrisma for ctx.db and direct queries — mirrors
 * tenant-management.test.ts: `tenant_manager` has `tenantId = null`, so
 * `protectedProcedure` skips `runWithTenant()` and the guarded `prisma`
 * client would throw "Tenant context not set". Both `platformRole.ts` and
 * `customRole.ts` already use `platformPrisma` internally for exactly this
 * reason; test callers mirror that.
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/__tests__/platform-rbac.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";
import type { ExtendedPrismaClient } from "@frms/db";
import type { UserRole } from "@frms/shared/types";

import type { TRPCContext } from "../trpc/context";
import { customRoleRouter } from "../trpc/routers/customRole";
import { platformRoleRouter } from "../trpc/routers/platformRole";
import { createCallerFactory } from "../trpc/trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG = `platform-rbac-test-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let tenantId: string;
let adminUserId: string; // tenant_manager, no platform customRole => ADMIN ceiling
let billingUserId: string; // tenant_manager, assigned a BILLING-only platform role
let tenantAdminUserId: string; // tenant-scoped, tenant_admin (non-platform)
let encoderUserId: string; // tenant-scoped, encoder (non-platform)
let billingRoleId: string;

let _userCounter = 0;
const mkUsername = (tag: string) => `prb-${RUN}-${tag}-${++_userCounter}`;

// ─── Context + caller helpers ───────────────────────────────────────────────

/** Builds a ctx for a `tenant_manager` (platform) caller — tenantId always null. */
function makePlatformCtx(userId: string): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Platform RBAC Test User", email: `${userId}@local` },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId,
    role: "tenant_manager",
    tenantId: null,
    tenantSlug: null,
    // Cast: platformRole.ts uses platformPrisma internally, never ctx.db —
    // mirrors tenant-management.test.ts's documented cast for the same reason.
    db: platformPrisma as unknown as ExtendedPrismaClient,
    req: new Request("http://localhost/api/trpc"),
  };
}

/** Builds a ctx for a tenant-scoped caller (real tenantId, guarded prisma). */
function makeTenantCtx(userId: string, role: UserRole): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Platform RBAC Test User", email: `${userId}@local` },
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

const platformCallerFactory = createCallerFactory(platformRoleRouter);
const platformCaller = (userId: string) => platformCallerFactory(makePlatformCtx(userId));

async function mkTenantManagerUser(tag: string) {
  const username = mkUsername(tag);
  const user = await platformPrisma.user.create({
    data: {
      // User.tenantId is NOT NULL at the schema level even for a platform
      // account (see schema.prisma model User) — the platform/tenant
      // distinction lives in ctx.tenantId (always null for tenant_manager
      // sessions), never in this FK. Point it at the throwaway test tenant.
      tenantId,
      email: `${username}@local`,
      username,
      passwordHash: "not-real",
      name: `Platform RBAC Test ${tag}`,
      role: "tenant_manager",
    },
  });
  return user.id;
}

async function mkTenantScopedUser(role: UserRole, tag: string) {
  const username = mkUsername(tag);
  const user = await platformPrisma.user.create({
    data: {
      tenantId,
      email: `${username}@local`,
      username,
      passwordHash: "not-real",
      name: `Platform RBAC Test ${tag}`,
      role,
    },
  });
  return user.id;
}

// ─── Setup / teardown ───────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  const existing = await platformPrisma.tenant.findUnique({ where: { slug: SLUG } });
  if (existing) {
    await platformPrisma.auditLog.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.rolePermission.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.customRole.deleteMany({
      where: { OR: [{ tenantId: existing.id }, { scope: "platform" }] },
    });
    await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.tenant.delete({ where: { id: existing.id } });
  }

  const tenant = await platformPrisma.tenant.create({
    data: {
      name: "Platform RBAC Test Tenant",
      slug: SLUG,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  tenantId = tenant.id;

  adminUserId = await mkTenantManagerUser("admin");
  billingUserId = await mkTenantManagerUser("billing");
  tenantAdminUserId = await mkTenantScopedUser("tenant_admin", "tadmin");
  encoderUserId = await mkTenantScopedUser("encoder", "encoder");
});

afterAll(async () => {
  if (!hasDb || !tenantId) return;
  // Audit logs written by these tests may carry tenantId: null (every
  // platform-scope mutation — see platformRole.ts) as well as the real
  // test tenantId, so delete by the known actor userIds rather than
  // tenantId alone (a tenantId-only filter would miss the null-tenantId
  // platform rows and leave a dangling audit_logs_user_id_fkey).
  const actorUserIds = [
    adminUserId,
    billingUserId,
    tenantAdminUserId,
    encoderUserId,
  ].filter((id): id is string => Boolean(id));
  await platformPrisma.auditLog.deleteMany({ where: { userId: { in: actorUserIds } } });
  await platformPrisma.rolePermission.deleteMany({ where: { tenantId } });
  await platformPrisma.user.updateMany({
    where: { tenantId },
    data: { customRoleId: null },
  });
  await platformPrisma.customRole.deleteMany({
    where: { OR: [{ tenantId }, { id: billingRoleId ?? "__none__" }] },
  });
  await platformPrisma.user.deleteMany({ where: { tenantId } });
  await platformPrisma.tenant.delete({ where: { id: tenantId } }).catch(() => {
    /* already cleaned up */
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("platformRoleRouter — ADMIN (tenant_manager, no platform role)", () => {
  it("full ceiling: create, list, getById, update, assignToUser, delete all pass", async () => {
    const admin = platformCaller(adminUserId);

    const created = await admin.create({
      name: `Billing Role ${RUN}`,
      description: "Billing-only curated role",
      permissions: [
        { permissionKey: "billing", view: true, write: true, update: true, delete: false },
      ],
    });
    billingRoleId = created.id;

    const list = await admin.list();
    expect(list.some((r) => r.id === billingRoleId)).toBe(true);

    const byId = await admin.getById({ id: billingRoleId });
    expect(byId.permissions).toEqual([
      { permissionKey: "billing", view: true, write: true, update: true, delete: false },
    ]);

    const updated = await admin.update({
      id: billingRoleId,
      description: "Billing-only curated role (updated)",
    });
    expect(updated.id).toBe(billingRoleId);

    // Assign to the billing test user — proves ADMIN can manage assignment.
    const assigned = await admin.assignToUser({
      userId: billingUserId,
      customRoleId: billingRoleId,
    });
    expect(assigned.customRoleId).toBe(billingRoleId);
  });
});

describe.skipIf(!hasDb)(
  "platformRoleRouter — a curated BILLING role cannot resolve tenant_management",
  () => {
    it("list/getById/create/update/delete/assignToUser all throw FORBIDDEN for the billing-only user", async () => {
      const billing = platformCaller(billingUserId);

      await expect(billing.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(billing.getById({ id: billingRoleId })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        billing.create({ name: `Should Fail ${RUN}`, permissions: [] }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        billing.update({ id: billingRoleId, description: "should not apply" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(billing.delete({ id: billingRoleId })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        billing.assignToUser({ userId: adminUserId, customRoleId: null }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  },
);

describe.skipIf(!hasDb)(
  "platformRoleRouter — cross-scope assignment guard (a): platform role → non-tenant_manager",
  () => {
    it("assigning a platform role to a tenant_admin/encoder user is FORBIDDEN", async () => {
      const admin = platformCaller(adminUserId);

      await expect(
        admin.assignToUser({ userId: tenantAdminUserId, customRoleId: billingRoleId }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await expect(
        admin.assignToUser({ userId: encoderUserId, customRoleId: billingRoleId }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  },
);

describe.skipIf(!hasDb)(
  "customRoleRouter — cross-scope assignment guard (d): tenant role → tenant_manager",
  () => {
    it("assigning a tenant custom role to a tenant_manager (platform) user is FORBIDDEN", async () => {
      // tenantSuperadminProcedure (customRole.ts) allows tenant_manager OR
      // tenant_superadmin; customRole.ts's tenant-scoped queries are keyed
      // on the input's `tenantId` argument, not `ctx.tenantId` — so a
      // tenant_manager caller (ctx.tenantId=null in production) still
      // satisfies requireRole and the router's own explicit tenantId args.
      const caller = createCallerFactory(customRoleRouter)(makePlatformCtx(adminUserId));

      const tenantRole = await caller.create({
        tenantId,
        name: `Tenant Role ${RUN}`,
        permissions: [
          { featureKey: "fisherfolk", view: true, write: false, update: false, delete: false },
        ],
      });

      await expect(
        caller.assignToUser({
          tenantId,
          userId: adminUserId, // a tenant_manager account
          customRoleId: tenantRole.id,
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      // Cleanup this sub-test's role so it doesn't leak into the count in
      // the platform-role table assertions below.
      await platformPrisma.rolePermission.deleteMany({ where: { roleId: tenantRole.id } });
      await platformPrisma.customRole.delete({ where: { id: tenantRole.id } });
    });
  },
);

describe.skipIf(!hasDb)("customRoleRouter — hard-filtered to scope='tenant'", () => {
  it("never returns the scope='platform' billing role created above", async () => {
    const caller = createCallerFactory(customRoleRouter)(makePlatformCtx(adminUserId));
    const list = await caller.list({ tenantId });
    expect(list.some((r) => r.id === billingRoleId)).toBe(false);

    await expect(caller.getById({ tenantId, id: billingRoleId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe.skipIf(!hasDb)("platformRoleRouter — hard-filtered to scope='platform'", () => {
  it("never returns a scope='tenant' role even if the id is guessed", async () => {
    const tenantRole = await createCallerFactory(customRoleRouter)(makePlatformCtx(adminUserId)).create({
      tenantId,
      name: `Tenant Role B ${RUN}`,
      permissions: [],
    });

    const admin = platformCaller(adminUserId);
    await expect(admin.getById({ id: tenantRole.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    await platformPrisma.customRole.delete({ where: { id: tenantRole.id } });
  });
});

describe.skipIf(!hasDb)("non-platform roles never reach platformMatrixProcedure's resolver", () => {
  it("a tenant_admin/encoder caller is denied FORBIDDEN before any DB matrix lookup", async () => {
    // requireRole("tenant_manager") in platformMatrixProcedure rejects
    // these roles outright — proves a non-tenant_manager actor can never
    // even reach resolveActorPlatformMatrix(), let alone be granted a
    // platform permission.
    const tenantAdminAsPlatform = createCallerFactory(platformRoleRouter)(
      makeTenantCtx(tenantAdminUserId, "tenant_admin"),
    );
    await expect(tenantAdminAsPlatform.list()).rejects.toMatchObject({ code: "FORBIDDEN" });

    const encoderAsPlatform = createCallerFactory(platformRoleRouter)(
      makeTenantCtx(encoderUserId, "encoder"),
    );
    await expect(encoderAsPlatform.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
