/**
 * Integration tests — matrixProcedure() + resolveActorMatrix() (PD-005 Chunk 3)
 *
 * Exercises the fisherfolk router pilot adoption end-to-end against a real
 * Postgres: a custom-role user's `RolePermission` rows correctly gate
 * `fisherfolk.list`/`create` through `hasPermission()`, a fixed-tier
 * `tenant_admin` always passes (ceiling, no DB matrix lookup), and a plain
 * `viewer` (no custom role) still resolves through the DOMAIN_ROLE_PRESETS
 * fallback exactly as before this chunk.
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/__tests__/matrix-procedure.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses the tenant guard
 * extension — CustomRole/RolePermission/User/Tenant are tenant-scoped
 * models with no ALS context outside a request). Uses the GUARDED `prisma`
 * client as every test caller's ctx.db — mirrors production: a custom-role
 * user is always `encoder`/`viewer`/`bantay_dagat` (never `tenant_manager`),
 * so it always has a real tenantId and protectedProcedure always calls
 * runWithTenant() for it. This is also the explicit "boundary" assertion
 * this file makes: none of these calls should ever throw
 * "Tenant context not set" (the platformPrisma-vs-guarded-prisma footgun
 * documented in tenant-succession.test.ts).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";
import type { UserRole } from "@frms/shared/types";

import type { TRPCContext } from "../trpc/context";
import { fisherfolkRouter } from "../trpc/routers/fisherfolk";
import { createCallerFactory } from "../trpc/trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG = `matrix-test-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let tenantId: string;
let viewOnlyUserId: string;
let writeUserId: string;
let tenantAdminUserId: string;
let plainViewerUserId: string;

const createdFisherfolkIds: string[] = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(userId: string, role: UserRole): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Matrix Test User", email: `${userId}@local` },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId,
    role,
    tenantId,
    tenantSlug: SLUG,
    // Guarded client — see module doc "boundary" note above.
    db: prisma,
    // A FRESH Request per caller — mirrors one real HTTP request each,
    // which is exactly the scope resolveActorMatrix()'s WeakMap memoizes.
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(fisherfolkRouter);
const caller = (userId: string, role: UserRole) =>
  callerFactory(makeCtx(userId, role));

function fisherfolkCreateInput(idNumber: string) {
  return {
    idNumber,
    fullName: "Matrix Test Fisher",
    lastName: "Fisher",
    firstName: "Matrix",
    dateOfBirth: new Date("1990-01-01"),
    sex: "MALE" as const,
    address: "123 Matrix St",
    barangay: "Barangay Matrix",
    registrationYear: new Date().getFullYear(),
    categoryIds: [] as string[],
  };
}

async function mkUser(role: UserRole, customRoleId?: string) {
  const suffix = `${role}-${customRoleId ? "custom" : "plain"}-${RUN}-${Math.random().toString(36).slice(2, 8)}`;
  const user = await platformPrisma.user.create({
    data: {
      tenantId,
      email: `${suffix}@local`,
      username: suffix,
      passwordHash: "not-real",
      name: `Matrix Test ${role}`,
      role,
      ...(customRoleId ? { customRoleId } : {}),
    },
  });
  return user.id;
}

/** Creates an ACTIVE CustomRole plus one RolePermission row on "fisherfolk". */
async function mkCustomRole(
  name: string,
  grants: { view?: boolean; write?: boolean; update?: boolean; delete?: boolean },
) {
  const role = await platformPrisma.customRole.create({
    data: { tenantId, name, isActive: true },
  });
  await platformPrisma.rolePermission.create({
    data: {
      tenantId,
      roleId: role.id,
      featureKey: "fisherfolk",
      view: grants.view ?? false,
      write: grants.write ?? false,
      update: grants.update ?? false,
      delete: grants.delete ?? false,
    },
  });
  return role.id;
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  const existing = await platformPrisma.tenant.findUnique({ where: { slug: SLUG } });
  if (existing) {
    await platformPrisma.auditLog.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.fisherfolk.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.rolePermission.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.customRole.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.tenant.delete({ where: { id: existing.id } });
  }

  const tenant = await platformPrisma.tenant.create({
    data: {
      name: "Matrix Procedure Test Tenant",
      slug: SLUG,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  tenantId = tenant.id;

  const viewOnlyRoleId = await mkCustomRole("View Only", { view: true });
  const writeRoleId = await mkCustomRole("Write Enabled", {
    view: true,
    write: true,
    update: true,
  });

  // Base role "encoder" on both custom-role users — proves the MATRIX
  // overrides the encoder preset (encoder's preset alone would grant write
  // on fisherfolk; the view-only matrix must still deny it).
  viewOnlyUserId = await mkUser("encoder", viewOnlyRoleId);
  writeUserId = await mkUser("encoder", writeRoleId);
  tenantAdminUserId = await mkUser("tenant_admin");
  plainViewerUserId = await mkUser("viewer");
});

afterAll(async () => {
  if (!hasDb || !tenantId) return;

  await platformPrisma.auditLog.deleteMany({ where: { tenantId } });
  if (createdFisherfolkIds.length > 0) {
    await platformPrisma.fisherfolk.deleteMany({ where: { id: { in: createdFisherfolkIds } } });
  }
  await platformPrisma.fisherfolk.deleteMany({ where: { tenantId } });
  await platformPrisma.rolePermission.deleteMany({ where: { tenantId } });
  await platformPrisma.customRole.deleteMany({ where: { tenantId } });
  await platformPrisma.user.deleteMany({ where: { tenantId } });
  await platformPrisma.tenant.delete({ where: { id: tenantId } }).catch(() => {
    /* already cleaned up */
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("matrixProcedure — custom role (view-only)", () => {
  it("list passes", async () => {
    const c = caller(viewOnlyUserId, "encoder");
    const result = await c.list({ page: 1, limit: 10 });
    expect(result).toHaveProperty("items");
  });

  it("create throws FORBIDDEN (matrix overrides the encoder write preset)", async () => {
    const c = caller(viewOnlyUserId, "encoder");
    await expect(
      c.create(fisherfolkCreateInput(`FF-MATRIX-VIEWONLY-${RUN}`)),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe.skipIf(!hasDb)("matrixProcedure — custom role (write-enabled)", () => {
  it("create passes", async () => {
    const c = caller(writeUserId, "encoder");
    const created = await c.create(fisherfolkCreateInput(`FF-MATRIX-WRITE-${RUN}`));
    createdFisherfolkIds.push(created.id);
    expect(created.idNumber).toBe(`FF-MATRIX-WRITE-${RUN}`);
  });
});

describe.skipIf(!hasDb)("matrixProcedure — tenant_admin (fixed ceiling)", () => {
  it("all fisherfolk actions pass — no DB matrix lookup needed", async () => {
    const c = caller(tenantAdminUserId, "tenant_admin");

    const created = await c.create(fisherfolkCreateInput(`FF-MATRIX-ADMIN-${RUN}`));
    createdFisherfolkIds.push(created.id);

    const listed = await c.list({ page: 1, limit: 10 });
    expect(listed.items.some((i) => i.id === created.id)).toBe(true);

    const updated = await c.update({ id: created.id, remarks: "matrix-updated" });
    expect(updated.remarks).toBe("matrix-updated");

    const archived = await c.archive({ id: created.id });
    expect(archived.success).toBe(true);
  });
});

describe.skipIf(!hasDb)("matrixProcedure — plain viewer (no custom role, preset fallback)", () => {
  it("create throws FORBIDDEN, list passes", async () => {
    const c = caller(plainViewerUserId, "viewer");

    await expect(
      c.create(fisherfolkCreateInput(`FF-MATRIX-VIEWER-${RUN}`)),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const result = await c.list({ page: 1, limit: 10 });
    expect(result).toHaveProperty("items");
  });
});

describe.skipIf(!hasDb)("matrixProcedure — platformPrisma/guarded-prisma boundary", () => {
  it("a custom-role user's real tenantId routes through runWithTenant — never 'Tenant context not set'", async () => {
    // Every call above already exercises this path (ctx.db = guarded prisma
    // for encoder/tenant_admin/viewer, all with a real tenantId). This test
    // makes the invariant explicit: resolveActorMatrix's own DB reads
    // (User.customRoleId + RolePermission) also go through the SAME
    // guarded client without throwing, because protectedProcedure already
    // called runWithTenant(tenantId, ...) before matrixProcedure's
    // middleware runs.
    const c = caller(writeUserId, "encoder");
    await expect(c.list({ page: 1, limit: 10 })).resolves.toHaveProperty("items");
  });
});
