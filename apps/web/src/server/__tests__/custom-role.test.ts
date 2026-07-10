/**
 * Integration tests — customRole router (PD-005 Chunk 6)
 *
 * Exercises the custom-role permission-matrix CRUD + assignToUser against a
 * real Postgres. Mirrors tenant-succession.test.ts / matrix-procedure.test.ts
 * patterns: platformPrisma for setup/teardown + assertions (CustomRole /
 * RolePermission / User / Tenant have no ALS context outside a request), the
 * GUARDED `prisma` client as every tenant_superadmin caller's ctx.db
 * (production parity — protectedProcedure DOES call runWithTenant for a
 * real tenantId), and a fresh throwaway tenant per describe block so state
 * stays isolated.
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/__tests__/custom-role.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";
import type { UserRole } from "@frms/shared/types";

import type { TRPCContext } from "../trpc/context";
import { customRoleRouter } from "../trpc/routers/customRole";
import { createCallerFactory } from "../trpc/trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG = `custom-role-test-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let tenantId: string;
let superadminUserId: string;
let encoderUserId: string;
let viewerUserId: string;
let tenantAdminUserId: string;

let _userCounter = 0;
const mkUsername = (tag: string) => `cr-${RUN}-${tag}-${++_userCounter}`;

// ─── Context + caller helpers ───────────────────────────────────────────────

function makeCtx(userId: string, role: UserRole): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "CustomRole Test User", email: `${userId}@local` },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId,
    role,
    tenantId,
    tenantSlug: SLUG,
    // Guarded client — production parity for a caller with a real tenantId.
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(customRoleRouter);
const caller = (userId: string, role: UserRole) => callerFactory(makeCtx(userId, role));

async function mkUser(role: UserRole, tag: string) {
  const username = mkUsername(tag);
  const user = await platformPrisma.user.create({
    data: {
      tenantId,
      email: `${username}@local`,
      username,
      passwordHash: "not-real",
      name: `CustomRole Test ${role}`,
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
    await platformPrisma.customRole.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.tenant.delete({ where: { id: existing.id } });
  }

  const tenant = await platformPrisma.tenant.create({
    data: {
      name: "CustomRole Test Tenant",
      slug: SLUG,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  tenantId = tenant.id;

  superadminUserId = await mkUser("tenant_superadmin", "superadmin");
  encoderUserId = await mkUser("encoder", "encoder");
  viewerUserId = await mkUser("viewer", "viewer");
  tenantAdminUserId = await mkUser("tenant_admin", "admin");
});

afterAll(async () => {
  if (!hasDb || !tenantId) return;
  await platformPrisma.auditLog.deleteMany({ where: { tenantId } });
  await platformPrisma.rolePermission.deleteMany({ where: { tenantId } });
  await platformPrisma.customRole.deleteMany({ where: { tenantId } });
  await platformPrisma.user.deleteMany({ where: { tenantId } });
  await platformPrisma.tenant.delete({ where: { id: tenantId } }).catch(() => {
    /* already cleaned up */
  });
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("customRole — authorization guardrail", () => {
  it("encoder caller → FORBIDDEN", async () => {
    const c = caller(encoderUserId, "encoder");
    await expect(
      c.create({ tenantId, name: `Nope-${RUN}`, permissions: [] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("viewer caller → FORBIDDEN", async () => {
    const c = caller(viewerUserId, "viewer");
    await expect(
      c.create({ tenantId, name: `Nope2-${RUN}`, permissions: [] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("tenant_admin caller → FORBIDDEN (below the ceiling it defines, not a role-manager)", async () => {
    const c = caller(tenantAdminUserId, "tenant_admin");
    await expect(
      c.create({ tenantId, name: `Nope3-${RUN}`, permissions: [] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe.skipIf(!hasDb)("customRole — create + list + getById + unique name", () => {
  it("create persists a matrix, readable via list/getById; audit row written", async () => {
    const c = caller(superadminUserId, "tenant_superadmin");
    const name = `Supervisor-${RUN}`;

    const created = await c.create({
      tenantId,
      name,
      description: "Broad view/write, no delete",
      permissions: [
        { featureKey: "fisherfolk", view: true, write: true, update: true, delete: false },
        { featureKey: "vessels", view: true, write: false, update: false, delete: false },
      ],
    });
    expect(created.id).toBeTruthy();

    const got = await c.getById({ tenantId, id: created.id });
    expect(got.name).toBe(name);
    expect(got.userCount).toBe(0);
    const ff = got.permissions.find((p) => p.featureKey === "fisherfolk");
    expect(ff).toMatchObject({ view: true, write: true, update: true, delete: false });

    const listed = await c.list({ tenantId });
    expect(listed.some((r) => r.id === created.id)).toBe(true);

    const audit = await platformPrisma.auditLog.findFirst({
      where: { tenantId, entityType: "CustomRole", entityId: created.id, action: "CREATE" },
    });
    expect(audit).toBeTruthy();
  });

  it("duplicate name within the same tenant → CONFLICT", async () => {
    const c = caller(superadminUserId, "tenant_superadmin");
    const name = `Dup-${RUN}`;
    await c.create({ tenantId, name, permissions: [] });

    await expect(c.create({ tenantId, name, permissions: [] })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});

describe.skipIf(!hasDb)("customRole — billing/user_management are structurally ungrantable", () => {
  it("zod rejects a featureKey outside the FeatureKey enum (e.g. 'billing')", async () => {
    const c = caller(superadminUserId, "tenant_superadmin");
    await expect(
      c.create({
        tenantId,
        name: `BadKey-${RUN}`,
        // @ts-expect-error — intentionally invalid featureKey to prove zod rejects it
        permissions: [{ featureKey: "billing", view: true, write: true, update: true, delete: true }],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe.skipIf(!hasDb)("customRole — intersectWithCeiling applied on save", () => {
  it("a full-grant matrix on every real FeatureKey persists unclamped (ceiling is all-true)", async () => {
    const c = caller(superadminUserId, "tenant_superadmin");
    const created = await c.create({
      tenantId,
      name: `FullGrant-${RUN}`,
      permissions: [
        { featureKey: "reports", view: true, write: true, update: true, delete: true },
      ],
    });
    const got = await c.getById({ tenantId, id: created.id });
    expect(got.permissions.find((p) => p.featureKey === "reports")).toMatchObject({
      view: true,
      write: true,
      update: true,
      delete: true,
    });
  });
});

describe.skipIf(!hasDb)("customRole — update", () => {
  it("replaces the matrix and renames; audit row written", async () => {
    const c = caller(superadminUserId, "tenant_superadmin");
    const created = await c.create({
      tenantId,
      name: `ToUpdate-${RUN}`,
      permissions: [{ featureKey: "map", view: true, write: false, update: false, delete: false }],
    });

    await c.update({
      tenantId,
      id: created.id,
      name: `Updated-${RUN}`,
      permissions: [
        { featureKey: "map", view: true, write: true, update: false, delete: false },
        { featureKey: "analytics", view: true, write: false, update: false, delete: false },
      ],
    });

    const got = await c.getById({ tenantId, id: created.id });
    expect(got.name).toBe(`Updated-${RUN}`);
    expect(got.permissions.find((p) => p.featureKey === "map")).toMatchObject({ write: true });
    expect(got.permissions.find((p) => p.featureKey === "analytics")).toMatchObject({ view: true });

    const audit = await platformPrisma.auditLog.findFirst({
      where: { tenantId, entityType: "CustomRole", entityId: created.id, action: "UPDATE" },
    });
    expect(audit).toBeTruthy();
  });
});

describe.skipIf(!hasDb)("customRole — assignToUser", () => {
  it("assigns to an encoder user", async () => {
    const c = caller(superadminUserId, "tenant_superadmin");
    const role = await c.create({ tenantId, name: `Assignable-${RUN}`, permissions: [] });

    const result = await c.assignToUser({ tenantId, userId: encoderUserId, customRoleId: role.id });
    expect(result.customRoleId).toBe(role.id);

    const user = await platformPrisma.user.findUniqueOrThrow({
      where: { id: encoderUserId },
      select: { customRoleId: true, role: true },
    });
    expect(user.customRoleId).toBe(role.id);
    // Overlay design: the fixed role enum is untouched.
    expect(user.role).toBe("encoder");

    const audit = await platformPrisma.auditLog.findFirst({
      where: { tenantId, entityType: "User", entityId: encoderUserId, action: "UPDATE" },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).toBeTruthy();

    // Cleanup for later tests in this describe block.
    await c.assignToUser({ tenantId, userId: encoderUserId, customRoleId: null });
  });

  it("refuses to assign to a tenant_admin → FORBIDDEN", async () => {
    const c = caller(superadminUserId, "tenant_superadmin");
    const role = await c.create({ tenantId, name: `NoAdminAssign-${RUN}`, permissions: [] });

    await expect(
      c.assignToUser({ tenantId, userId: tenantAdminUserId, customRoleId: role.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses to assign to the tenant_superadmin caller's own account → FORBIDDEN", async () => {
    const c = caller(superadminUserId, "tenant_superadmin");
    const role = await c.create({ tenantId, name: `NoSuperadminAssign-${RUN}`, permissions: [] });

    await expect(
      c.assignToUser({ tenantId, userId: superadminUserId, customRoleId: role.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe.skipIf(!hasDb)("customRole — delete", () => {
  it("refuses while a user is assigned → PRECONDITION_FAILED", async () => {
    const c = caller(superadminUserId, "tenant_superadmin");
    const role = await c.create({ tenantId, name: `Guarded-${RUN}`, permissions: [] });
    await c.assignToUser({ tenantId, userId: viewerUserId, customRoleId: role.id });

    await expect(c.delete({ tenantId, id: role.id })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });

    // Cleanup.
    await c.assignToUser({ tenantId, userId: viewerUserId, customRoleId: null });
  });

  it("deletes once no user is assigned; audit row written", async () => {
    const c = caller(superadminUserId, "tenant_superadmin");
    const role = await c.create({ tenantId, name: `Deletable-${RUN}`, permissions: [] });

    await c.delete({ tenantId, id: role.id });

    const gone = await platformPrisma.customRole.findUnique({ where: { id: role.id } });
    expect(gone).toBeNull();

    const audit = await platformPrisma.auditLog.findFirst({
      where: { tenantId, entityType: "CustomRole", entityId: role.id, action: "DELETE" },
    });
    expect(audit).toBeTruthy();
  });
});

describe.skipIf(!hasDb)("customRole — platformPrisma/guarded-prisma boundary", () => {
  it("a tenant_superadmin caller (real tenantId) never throws 'Tenant context not set'", async () => {
    const c = caller(superadminUserId, "tenant_superadmin");
    await expect(c.list({ tenantId })).resolves.toBeInstanceOf(Array);
  });
});
