/**
 * Integration tests — idTemplate tRPC router
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/__tests__/idTemplate.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — adminProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../../context";
import { idTemplateRouter } from "../idTemplate";
import { createCallerFactory } from "../../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG_A = `idt-test-a-${RUN}`;
const SLUG_B = `idt-test-b-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantAId: string;
let testTenantBId: string;
let testAdminId: string;
let testViewerId: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(
  tenantId: string,
  userId: string,
  role: "admin" | "encoder" | "viewer" = "admin",
): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Test Admin", email: "admin@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId,
    role,
    tenantId,
    tenantSlug: SLUG_A,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(idTemplateRouter);

const callerAs = (tenantId: string, userId: string, role: "admin" | "encoder" | "viewer" = "admin") =>
  callerFactory(makeCtx(tenantId, userId, role));

const MINIMAL_ELEMENTS = [] as const;

async function createTemplate(
  tenantId: string,
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  return platformPrisma.iDTemplate.create({
    data: {
      tenantId,
      name: `Template-${RUN}-${Math.random().toString(36).slice(2)}`,
      templateType: "FISHERFOLK",
      frontElements: MINIMAL_ELEMENTS,
      backElements: MINIMAL_ELEMENTS,
      status: "ARCHIVED",
      createdById: userId,
      ...overrides,
    },
  });
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  for (const slug of [SLUG_A, SLUG_B]) {
    const existing = await platformPrisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      await platformPrisma.auditLog.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.iDTemplate.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.tenant.delete({ where: { id: existing.id } });
    }
  }

  const tenantA = await platformPrisma.tenant.create({
    data: {
      name: "IDT Test Tenant A",
      slug: SLUG_A,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantAId = tenantA.id;

  const tenantB = await platformPrisma.tenant.create({
    data: {
      name: "IDT Test Tenant B",
      slug: SLUG_B,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantBId = tenantB.id;

  const admin = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `admin-${RUN}@local`,
      username: `admin-${RUN}`,
      passwordHash: "not-real",
      name: "Test Admin",
      role: "admin",
    },
  });
  testAdminId = admin.id;

  const viewer = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `viewer-${RUN}@local`,
      username: `viewer-${RUN}`,
      passwordHash: "not-real",
      name: "Test Viewer",
      role: "viewer",
    },
  });
  testViewerId = viewer.id;
});

afterAll(async () => {
  if (!hasDb) return;
  if (!testTenantAId || !testTenantBId) return;

  // Delete ALL templates (both tenants) before ANY users: cross-tenant tests
  // create tenant-B templates whose created_by_id points at a tenant-A user,
  // so deleting tenant-A users first violates id_templates_created_by_id_fkey.
  for (const tenantId of [testTenantAId, testTenantBId]) {
    await platformPrisma.auditLog.deleteMany({ where: { tenantId } });
    await platformPrisma.iDTemplate.deleteMany({ where: { tenantId } });
  }
  for (const tenantId of [testTenantAId, testTenantBId]) {
    await platformPrisma.user.deleteMany({ where: { tenantId } });
    await platformPrisma.tenant.delete({ where: { id: tenantId } }).catch(() => { /* already gone */ });
  }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("idTemplate router — audit log + RBAC", () => {
  // ── create ────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("creates a template and writes CREATE audit log", async () => {
      const caller = callerAs(testTenantAId, testAdminId, "admin");

      const result = await caller.create({
        name: "My Template",
        templateType: "FISHERFOLK",
        frontElements: [],
        backElements: [],
      });

      expect(result.name).toBe("My Template");
      expect(result.tenantId).toBe(testTenantAId);

      const log = await platformPrisma.auditLog.findFirst({
        where: { entityType: "IDTemplate", entityId: result.id, action: "CREATE" },
      });
      expect(log).not.toBeNull();
      expect(log?.userId).toBe(testAdminId);
      expect(log?.before).toBeNull();
      expect(log?.after).not.toBeNull();
    });

    it("FORBIDDEN for encoder role", async () => {
      const caller = callerAs(testTenantAId, testAdminId, "encoder");
      await expect(
        caller.create({ name: "X", templateType: "FISHERFOLK", frontElements: [], backElements: [] }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("FORBIDDEN for viewer role", async () => {
      const caller = callerAs(testTenantAId, testViewerId, "viewer");
      await expect(
        caller.create({ name: "X", templateType: "FISHERFOLK", frontElements: [], backElements: [] }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("updates a template and writes UPDATE audit log with before/after", async () => {
      const template = await createTemplate(testTenantAId, testAdminId);
      const caller = callerAs(testTenantAId, testAdminId, "admin");

      const result = await caller.update({
        id: template.id,
        data: { id: template.id, name: "Renamed Template" },
      });

      expect(result.name).toBe("Renamed Template");

      const log = await platformPrisma.auditLog.findFirst({
        where: { entityType: "IDTemplate", entityId: template.id, action: "UPDATE" },
        orderBy: { createdAt: "desc" },
      });
      expect(log).not.toBeNull();
      expect(log?.before).not.toBeNull();
      expect(log?.after).not.toBeNull();
    });

    it("NOT_FOUND for cross-tenant update (tenant isolation)", async () => {
      const templateB = await createTemplate(testTenantBId, testAdminId);
      const callerA = callerAs(testTenantAId, testAdminId, "admin");

      await expect(
        callerA.update({ id: templateB.id, data: { id: templateB.id, name: "Hack" } }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("FORBIDDEN for viewer role", async () => {
      const template = await createTemplate(testTenantAId, testAdminId);
      const caller = callerAs(testTenantAId, testViewerId, "viewer");
      await expect(
        caller.update({ id: template.id, data: { id: template.id, name: "Hack" } }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  // ── archive ───────────────────────────────────────────────────────────────

  describe("archive", () => {
    it("sets status ARCHIVED and writes UPDATE audit log with before/after", async () => {
      const template = await createTemplate(testTenantAId, testAdminId, { status: "ACTIVE" });
      const caller = callerAs(testTenantAId, testAdminId, "admin");

      const result = await caller.archive({ id: template.id });
      expect(result.status).toBe("ARCHIVED");

      const log = await platformPrisma.auditLog.findFirst({
        where: { entityType: "IDTemplate", entityId: template.id, action: "UPDATE" },
        orderBy: { createdAt: "desc" },
      });
      expect(log).not.toBeNull();
      expect(log?.before).not.toBeNull();
      expect(log?.after).not.toBeNull();
    });

    it("FORBIDDEN for encoder role", async () => {
      const template = await createTemplate(testTenantAId, testAdminId);
      const caller = callerAs(testTenantAId, testAdminId, "encoder");
      await expect(caller.archive({ id: template.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("deletes template and writes DELETE audit log with only before", async () => {
      const template = await createTemplate(testTenantAId, testAdminId);
      const caller = callerAs(testTenantAId, testAdminId, "admin");

      await caller.delete({ id: template.id });

      const deleted = await platformPrisma.iDTemplate.findUnique({ where: { id: template.id } });
      expect(deleted).toBeNull();

      const log = await platformPrisma.auditLog.findFirst({
        where: { entityType: "IDTemplate", entityId: template.id, action: "DELETE" },
      });
      expect(log).not.toBeNull();
      expect(log?.before).not.toBeNull();
      expect(log?.after).toBeNull();
    });

    it("FORBIDDEN for viewer role", async () => {
      const template = await createTemplate(testTenantAId, testAdminId);
      const caller = callerAs(testTenantAId, testViewerId, "viewer");
      await expect(caller.delete({ id: template.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  // ── duplicate ─────────────────────────────────────────────────────────────

  describe("duplicate", () => {
    it("produces a copy named '<name> (copy)' with status ARCHIVED", async () => {
      const source = await createTemplate(testTenantAId, testAdminId, { status: "ACTIVE", name: "Original" });
      const caller = callerAs(testTenantAId, testAdminId, "admin");

      const copy = await caller.duplicate({ id: source.id });

      expect(copy.name).toBe("Original (copy)");
      expect(copy.status).toBe("ARCHIVED");
      expect(copy.id).not.toBe(source.id);
      expect(copy.tenantId).toBe(testTenantAId);
    });

    it("duplicate does NOT collide with getActive (copy is ARCHIVED)", async () => {
      const source = await createTemplate(testTenantAId, testAdminId, {
        status: "ACTIVE",
        name: "Active Template",
        templateType: "VESSEL",
      });
      const caller = callerAs(testTenantAId, testAdminId, "admin");

      await caller.duplicate({ id: source.id });

      // getActive must still return the original ACTIVE template, not the copy
      const active = await caller.getActive({ templateType: "VESSEL" });
      expect(active.id).toBe(source.id);
      expect(active.status).toBe("ACTIVE");
    });

    it("writes CREATE audit log for the duplicate", async () => {
      const source = await createTemplate(testTenantAId, testAdminId, { name: "AuditMe" });
      const caller = callerAs(testTenantAId, testAdminId, "admin");

      const copy = await caller.duplicate({ id: source.id });

      const log = await platformPrisma.auditLog.findFirst({
        where: { entityType: "IDTemplate", entityId: copy.id, action: "CREATE" },
      });
      expect(log).not.toBeNull();
      expect(log?.before).toBeNull();
      expect(log?.after).not.toBeNull();
    });

    it("NOT_FOUND for cross-tenant duplicate (tenant isolation)", async () => {
      const templateB = await createTemplate(testTenantBId, testAdminId);
      const callerA = callerAs(testTenantAId, testAdminId, "admin");

      await expect(callerA.duplicate({ id: templateB.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("FORBIDDEN for encoder role", async () => {
      const source = await createTemplate(testTenantAId, testAdminId);
      const caller = callerAs(testTenantAId, testAdminId, "encoder");
      await expect(caller.duplicate({ id: source.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  // ── setActive (single-active invariant) ───────────────────────────────────

  describe("setActive", () => {
    it("activates the target and archives every other ACTIVE template of the same type", async () => {
      const oldActive = await createTemplate(testTenantAId, testAdminId, {
        status: "ACTIVE",
        name: "Old Active",
      });
      const target = await createTemplate(testTenantAId, testAdminId, {
        status: "ARCHIVED",
        name: "New Active",
      });
      const caller = callerAs(testTenantAId, testAdminId, "admin");

      const result = await caller.setActive({ id: target.id });
      expect(result.status).toBe("ACTIVE");

      const demoted = await platformPrisma.iDTemplate.findUnique({ where: { id: oldActive.id } });
      expect(demoted?.status).toBe("ARCHIVED");

      // getActive now resolves to the target — this is what the ID Generator loads
      const active = await caller.getActive({ templateType: "FISHERFOLK" });
      expect(active.id).toBe(target.id);
    });

    it("writes UPDATE audit logs for the activated AND the demoted template", async () => {
      const oldActive = await createTemplate(testTenantAId, testAdminId, { status: "ACTIVE" });
      const target = await createTemplate(testTenantAId, testAdminId, { status: "ARCHIVED" });
      const caller = callerAs(testTenantAId, testAdminId, "admin");

      await caller.setActive({ id: target.id });

      const targetLog = await platformPrisma.auditLog.findFirst({
        where: { entityType: "IDTemplate", entityId: target.id, action: "UPDATE" },
        orderBy: { createdAt: "desc" },
      });
      expect(targetLog).not.toBeNull();
      expect(targetLog?.before).not.toBeNull();
      expect(targetLog?.after).not.toBeNull();

      const demotedLog = await platformPrisma.auditLog.findFirst({
        where: { entityType: "IDTemplate", entityId: oldActive.id, action: "UPDATE" },
        orderBy: { createdAt: "desc" },
      });
      expect(demotedLog).not.toBeNull();
      expect((demotedLog?.after as { status?: string })?.status).toBe("ARCHIVED");
    });

    it("does not touch ACTIVE templates of a different templateType", async () => {
      const vesselActive = await createTemplate(testTenantAId, testAdminId, {
        status: "ACTIVE",
        templateType: "VESSEL",
      });
      const target = await createTemplate(testTenantAId, testAdminId, { status: "ARCHIVED" });
      const caller = callerAs(testTenantAId, testAdminId, "admin");

      await caller.setActive({ id: target.id });

      const vessel = await platformPrisma.iDTemplate.findUnique({ where: { id: vesselActive.id } });
      expect(vessel?.status).toBe("ACTIVE");
    });

    it("NOT_FOUND for cross-tenant setActive (tenant isolation)", async () => {
      const templateB = await createTemplate(testTenantBId, testAdminId);
      const callerA = callerAs(testTenantAId, testAdminId, "admin");
      await expect(callerA.setActive({ id: templateB.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("FORBIDDEN for encoder role", async () => {
      const target = await createTemplate(testTenantAId, testAdminId);
      const caller = callerAs(testTenantAId, testAdminId, "encoder");
      await expect(caller.setActive({ id: target.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  // ── single-active invariant on create/update ──────────────────────────────

  describe("single-active invariant (create/update)", () => {
    it("create with status ACTIVE archives the previously active template of the same type", async () => {
      const oldActive = await createTemplate(testTenantAId, testAdminId, { status: "ACTIVE" });
      const caller = callerAs(testTenantAId, testAdminId, "admin");

      const created = await caller.create({
        name: `Fresh-${Date.now()}`,
        templateType: "FISHERFOLK",
        status: "ACTIVE",
        frontElements: [],
        backElements: [],
      });

      const demoted = await platformPrisma.iDTemplate.findUnique({ where: { id: oldActive.id } });
      expect(demoted?.status).toBe("ARCHIVED");

      const actives = await platformPrisma.iDTemplate.findMany({
        where: { tenantId: testTenantAId, templateType: "FISHERFOLK", status: "ACTIVE" },
      });
      expect(actives).toHaveLength(1);
      expect(actives[0]?.id).toBe(created.id);
    });

    it("update to status ACTIVE archives the previously active template of the same type", async () => {
      const oldActive = await createTemplate(testTenantAId, testAdminId, { status: "ACTIVE" });
      const target = await createTemplate(testTenantAId, testAdminId, { status: "ARCHIVED" });
      const caller = callerAs(testTenantAId, testAdminId, "admin");

      await caller.update({ id: target.id, data: { id: target.id, status: "ACTIVE" } });

      const demoted = await platformPrisma.iDTemplate.findUnique({ where: { id: oldActive.id } });
      expect(demoted?.status).toBe("ARCHIVED");

      const actives = await platformPrisma.iDTemplate.findMany({
        where: { tenantId: testTenantAId, templateType: "FISHERFOLK", status: "ACTIVE" },
      });
      expect(actives).toHaveLength(1);
      expect(actives[0]?.id).toBe(target.id);
    });
  });

  // ── getById cross-tenant ──────────────────────────────────────────────────

  describe("getById cross-tenant isolation", () => {
    it("NOT_FOUND when reading another tenant's template", async () => {
      const templateB = await createTemplate(testTenantBId, testAdminId);
      const callerA = callerAs(testTenantAId, testAdminId, "admin");

      await expect(callerA.getById({ id: templateB.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
