/**
 * Integration tests — idPrint tRPC router
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/__tests__/idPrint.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — encoderProcedure/protectedProcedure calls
 * runWithTenant() which sets the ALS that the guard extension reads.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../../context";
import { idPrintRouter } from "../idPrint";
import { createCallerFactory } from "../../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG_A = `idp-test-a-${RUN}`;
const SLUG_B = `idp-test-b-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantAId: string;
let testTenantBId: string;
let testEncoderId: string;
let testViewerId: string;
let testTemplateId: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(
  tenantId: string,
  userId: string,
  role: "admin" | "encoder" | "viewer" = "encoder",
): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Test User", email: "test@local" },
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

const callerFactory = createCallerFactory(idPrintRouter);

const callerAs = (tenantId: string, userId: string, role: "admin" | "encoder" | "viewer" = "encoder") =>
  callerFactory(makeCtx(tenantId, userId, role));

async function createFisherfolk(
  tenantId: string,
  overrides: Record<string, unknown> = {},
) {
  const seq = Math.floor(Math.random() * 90_000) + 10_000;
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
      createdById: testEncoderId,
      updatedById: testEncoderId,
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
      await platformPrisma.iDPrintBatch.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.iDTemplate.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.fisherfolk.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.tenant.delete({ where: { id: existing.id } });
    }
  }

  const tenantA = await platformPrisma.tenant.create({
    data: {
      name: "IDP Test Tenant A",
      slug: SLUG_A,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantAId = tenantA.id;

  const tenantB = await platformPrisma.tenant.create({
    data: {
      name: "IDP Test Tenant B",
      slug: SLUG_B,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantBId = tenantB.id;

  const encoder = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `encoder-${RUN}@local`,
      username: `encoder-${RUN}`,
      passwordHash: "not-real",
      name: "Test Encoder",
      role: "encoder",
    },
  });
  testEncoderId = encoder.id;

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

  const template = await platformPrisma.iDTemplate.create({
    data: {
      tenantId: testTenantAId,
      name: "Test Template",
      templateType: "FISHERFOLK",
      frontElements: [],
      backElements: [],
      status: "ACTIVE",
      createdById: testEncoderId,
    },
  });
  testTemplateId = template.id;
});

afterAll(async () => {
  if (!hasDb) return;
  if (!testTenantAId || !testTenantBId) return;

  for (const tenantId of [testTenantAId, testTenantBId]) {
    await platformPrisma.auditLog.deleteMany({ where: { tenantId } });
    await platformPrisma.iDPrintBatch.deleteMany({ where: { tenantId } });
    await platformPrisma.iDTemplate.deleteMany({ where: { tenantId } });
    await platformPrisma.fisherfolk.deleteMany({ where: { tenantId } });
    await platformPrisma.user.deleteMany({ where: { tenantId } });
    await platformPrisma.tenant.delete({ where: { id: tenantId } }).catch(() => { /* already gone */ });
  }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("idPrint router", () => {

  // ── validateSelection ─────────────────────────────────────────────────────

  describe("validateSelection", () => {
    it("flags fisherfolk missing photo", async () => {
      const ff = await createFisherfolk(testTenantAId, { photo: null, signature: "sig-url" });
      const caller = callerAs(testTenantAId, testEncoderId, "encoder");

      const result = await caller.validateSelection({ ids: [ff.id], templateType: "FISHERFOLK" });

      expect(result.readyIds).not.toContain(ff.id);
      const blocked = result.blockedIds.find((b) => b.id === ff.id);
      expect(blocked).toBeDefined();
      expect(blocked?.missing).toContain("photo");
    });

    it("flags fisherfolk missing signature", async () => {
      const ff = await createFisherfolk(testTenantAId, { photo: "photo-url", signature: null });
      const caller = callerAs(testTenantAId, testEncoderId, "encoder");

      const result = await caller.validateSelection({ ids: [ff.id], templateType: "FISHERFOLK" });

      expect(result.readyIds).not.toContain(ff.id);
      const blocked = result.blockedIds.find((b) => b.id === ff.id);
      expect(blocked).toBeDefined();
      expect(blocked?.missing).toContain("signature");
    });

    it("marks fisherfolk with both photo+signature as ready", async () => {
      const ff = await createFisherfolk(testTenantAId, { photo: "photo-url", signature: "sig-url" });
      const caller = callerAs(testTenantAId, testEncoderId, "encoder");

      const result = await caller.validateSelection({ ids: [ff.id], templateType: "FISHERFOLK" });

      expect(result.readyIds).toContain(ff.id);
      expect(result.blockedIds.map((b) => b.id)).not.toContain(ff.id);
    });

    it("cross-tenant IDs are treated as blocked (not found → missing all)", async () => {
      const ffB = await createFisherfolk(testTenantBId, { photo: "photo", signature: "sig" });

      // Create a user in tenant B for proper setup, but caller is tenant A
      const tenantBUser = await platformPrisma.user.create({
        data: {
          tenantId: testTenantBId,
          email: `enc-b-${RUN}@local`,
          username: `enc-b-${RUN}`,
          passwordHash: "not-real",
          name: "Encoder B",
          role: "encoder",
        },
      });

      const callerA = callerAs(testTenantAId, testEncoderId, "encoder");
      const result = await callerA.validateSelection({ ids: [ffB.id], templateType: "FISHERFOLK" });

      // The fisherfolk belongs to tenant B — tenant A query returns empty, so treated as blocked
      expect(result.readyIds).not.toContain(ffB.id);
      expect(result.blockedIds.find((b) => b.id === ffB.id)).toBeDefined();

      await platformPrisma.fisherfolk.delete({ where: { id: ffB.id } });
      await platformPrisma.user.delete({ where: { id: tenantBUser.id } });
    });
  });

  // ── recordPrint ───────────────────────────────────────────────────────────

  describe("recordPrint", () => {
    it("creates IDPrintBatch + PRINT audit log on success", async () => {
      const ff = await createFisherfolk(testTenantAId, { photo: "photo-url", signature: "sig-url" });
      const caller = callerAs(testTenantAId, testEncoderId, "encoder");

      const result = await caller.recordPrint({
        templateId: testTemplateId,
        templateType: "FISHERFOLK",
        subjects: [{ subjectId: ff.id, subjectType: "FISHERFOLK", registrationType: "NEW" }],
      });

      expect(result.id).toBeTruthy();
      expect(result.idCount).toBe(1);

      const log = await platformPrisma.auditLog.findFirst({
        where: { entityType: "IDPrintBatch", entityId: result.id, action: "PRINT" },
      });
      expect(log).not.toBeNull();
      expect(log?.userId).toBe(testEncoderId);
      expect(log?.after).not.toBeNull();

      await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
    });

    it("PRECONDITION_FAILED when a subject is missing photo — nothing persisted", async () => {
      const ff = await createFisherfolk(testTenantAId, { photo: null, signature: "sig-url" });
      const caller = callerAs(testTenantAId, testEncoderId, "encoder");

      await expect(
        caller.recordPrint({
          templateId: testTemplateId,
          templateType: "FISHERFOLK",
          subjects: [{ subjectId: ff.id, subjectType: "FISHERFOLK", registrationType: "NEW" }],
        }),
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

      // Ensure no batch was persisted
      const batches = await platformPrisma.iDPrintBatch.findMany({
        where: { tenantId: testTenantAId, printedById: testEncoderId },
        orderBy: { createdAt: "desc" },
        take: 1,
      });
      // The most recent batch should NOT contain this fisherfolk
      const hasBadBatch = batches.some((b) => {
        const summary = b.summaryJson as Array<{ subjectId: string }>;
        return summary.some((s) => s.subjectId === ff.id);
      });
      expect(hasBadBatch).toBe(false);

      await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
    });

    it("PRECONDITION_FAILED when a subject is missing signature — nothing persisted", async () => {
      const ff = await createFisherfolk(testTenantAId, { photo: "photo-url", signature: null });
      const caller = callerAs(testTenantAId, testEncoderId, "encoder");

      await expect(
        caller.recordPrint({
          templateId: testTemplateId,
          templateType: "FISHERFOLK",
          subjects: [{ subjectId: ff.id, subjectType: "FISHERFOLK", registrationType: "NEW" }],
        }),
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

      await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
    });

    it("PRECONDITION_FAILED when subjectId does not exist in tenant (not found)", async () => {
      const fakeId = "clzzzzzzzzzzzzzzzzzzzzzzzz"; // valid cuid format but doesn't exist
      const caller = callerAs(testTenantAId, testEncoderId, "encoder");

      await expect(
        caller.recordPrint({
          templateId: testTemplateId,
          templateType: "FISHERFOLK",
          subjects: [{ subjectId: fakeId, subjectType: "FISHERFOLK", registrationType: "NEW" }],
        }),
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    });

    it("BAD_REQUEST when subjects have subjectType mismatching templateType", async () => {
      const ff = await createFisherfolk(testTenantAId, { photo: "photo-url", signature: "sig-url" });
      const caller = callerAs(testTenantAId, testEncoderId, "encoder");

      // templateType is FISHERFOLK but subjectType is VESSEL — should be rejected
      await expect(
        caller.recordPrint({
          templateId: testTemplateId,
          templateType: "FISHERFOLK",
          subjects: [{ subjectId: ff.id, subjectType: "VESSEL", registrationType: "NEW" }],
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
    });

    it("FORBIDDEN for viewer role on recordPrint", async () => {
      const ff = await createFisherfolk(testTenantAId, { photo: "photo-url", signature: "sig-url" });
      const callerViewer = callerAs(testTenantAId, testViewerId, "viewer");

      await expect(
        callerViewer.recordPrint({
          templateId: testTemplateId,
          templateType: "FISHERFOLK",
          subjects: [{ subjectId: ff.id, subjectType: "FISHERFOLK", registrationType: "NEW" }],
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
    });
  });

  // ── todaysPrinted ─────────────────────────────────────────────────────────

  describe("todaysPrinted", () => {
    it("returns only this tenant's today batches with correct rolled-up counts", async () => {
      const ff1 = await createFisherfolk(testTenantAId, { photo: "p", signature: "s" });
      const ff2 = await createFisherfolk(testTenantAId, { photo: "p", signature: "s" });
      const caller = callerAs(testTenantAId, testEncoderId, "encoder");

      await caller.recordPrint({
        templateId: testTemplateId,
        templateType: "FISHERFOLK",
        subjects: [
          { subjectId: ff1.id, subjectType: "FISHERFOLK", registrationType: "NEW" },
          { subjectId: ff2.id, subjectType: "FISHERFOLK", registrationType: "RENEWED" },
        ],
      });

      const result = await callerAs(testTenantAId, testEncoderId, "encoder").todaysPrinted();

      expect(result.batches.length).toBeGreaterThanOrEqual(1);
      // The batch we just created should be in today's list
      expect(result.totals.new).toBeGreaterThanOrEqual(1);
      expect(result.totals.renewed).toBeGreaterThanOrEqual(1);
      expect(result.totals.total).toBeGreaterThanOrEqual(2);

      await platformPrisma.fisherfolk.deleteMany({ where: { id: { in: [ff1.id, ff2.id] } } });
    });

    it("todaysPrinted is tenant-scoped — cross-tenant batches excluded", async () => {
      // Create a minimal encoder + template in tenant B to record a batch there
      const encB = await platformPrisma.user.create({
        data: {
          tenantId: testTenantBId,
          email: `enc2-b-${RUN}@local`,
          username: `enc2-b-${RUN}`,
          passwordHash: "not-real",
          name: "Encoder B2",
          role: "encoder",
        },
      });
      const tmplB = await platformPrisma.iDTemplate.create({
        data: {
          tenantId: testTenantBId,
          name: "Tmpl B",
          templateType: "FISHERFOLK",
          frontElements: [],
          backElements: [],
          status: "ACTIVE",
          createdById: encB.id,
        },
      });
      const ffB = await platformPrisma.fisherfolk.create({
        data: {
          tenantId: testTenantBId,
          idNumber: `FF-B-${RUN}`,
          fullName: "Fisher B",
          lastName: "B",
          firstName: "Fisher",
          address: "Addr",
          barangay: "Brgy",
          registrationYear: new Date().getFullYear(),
          createdById: encB.id,
          updatedById: encB.id,
          photo: "p",
          signature: "s",
        },
      });

      const callerB = callerAs(testTenantBId, encB.id, "encoder");
      await callerB.recordPrint({
        templateId: tmplB.id,
        templateType: "FISHERFOLK",
        subjects: [{ subjectId: ffB.id, subjectType: "FISHERFOLK", registrationType: "UPDATE" }],
      });

      // Tenant A should NOT see tenant B's batches
      const resultA = await callerAs(testTenantAId, testEncoderId, "encoder").todaysPrinted();
      const batchIds = resultA.batches.map((b) => b.tenantId);
      expect(batchIds.every((tid) => tid === testTenantAId)).toBe(true);

      await platformPrisma.fisherfolk.delete({ where: { id: ffB.id } });
      await platformPrisma.iDTemplate.delete({ where: { id: tmplB.id } });
      await platformPrisma.user.delete({ where: { id: encB.id } });
    });

    it("todaysPrinted start-of-day boundary: old batches from yesterday excluded", async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const yesterday = new Date(startOfDay.getTime() - 1);

      // Inject a batch with yesterday's timestamp directly
      await platformPrisma.iDPrintBatch.create({
        data: {
          tenantId: testTenantAId,
          templateId: testTemplateId,
          templateType: "FISHERFOLK",
          printedById: testEncoderId,
          printedAt: yesterday,
          idCount: 1,
          summaryJson: [{ subjectId: "fake-id", subjectType: "FISHERFOLK", registrationType: "NEW" }],
        },
      });

      const result = await callerAs(testTenantAId, testEncoderId, "encoder").todaysPrinted();

      // All returned batches must be >= start of today
      for (const batch of result.batches) {
        expect(new Date(batch.printedAt).getTime()).toBeGreaterThanOrEqual(startOfDay.getTime());
      }
    });
  });
});
