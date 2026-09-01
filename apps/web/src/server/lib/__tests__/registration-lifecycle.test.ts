/**
 * Integration tests — registration-lifecycle helper
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/lib/__tests__/registration-lifecycle.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as the db arg passed to the helper.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { platformPrisma, prisma } from "@frms/db";
import { resetAnnualRegistrations } from "../registration-lifecycle";

const hasDb = Boolean(process.env.DATABASE_URL);
const RUN = Date.now().toString(36);
const SLUG = `rl-test-${RUN}`;
let testTenantId: string;
let testUserId: string;
let otherTenantId: string;
let otherUserId: string;

beforeAll(async () => {
  if (!hasDb) return;
  const existing = await platformPrisma.tenant.findUnique({
    where: { slug: SLUG },
  });
  if (existing) {
    await platformPrisma.fisherfolk.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.tenant.delete({ where: { id: existing.id } });
  }
  const tenant = await platformPrisma.tenant.create({
    data: {
      name: "RL Test Tenant",
      slug: SLUG,
      status: "ACTIVE",
      currentRegistrationYear: 2025,
    },
  });
  testTenantId = tenant.id;
  const user = await platformPrisma.user.create({
    data: {
      tenantId: testTenantId,
      email: `rl-${RUN}@local`,
      username: `rl-${RUN}`,
      passwordHash: "x",
      name: "RL User",
      role: "tenant_superadmin",
    },
  });
  testUserId = user.id;

  const otherSlug = `rl-test-other-${RUN}`;
  const otherExisting = await platformPrisma.tenant.findUnique({
    where: { slug: otherSlug },
  });
  if (otherExisting) {
    await platformPrisma.fisherfolk.deleteMany({
      where: { tenantId: otherExisting.id },
    });
    await platformPrisma.user.deleteMany({
      where: { tenantId: otherExisting.id },
    });
    await platformPrisma.tenant.delete({ where: { id: otherExisting.id } });
  }
  const otherTenant = await platformPrisma.tenant.create({
    data: {
      name: "RL Other Tenant",
      slug: otherSlug,
      status: "ACTIVE",
      currentRegistrationYear: 2025,
    },
  });
  otherTenantId = otherTenant.id;
  const otherUser = await platformPrisma.user.create({
    data: {
      tenantId: otherTenantId,
      email: `rl-other-${RUN}@local`,
      username: `rl-other-${RUN}`,
      passwordHash: "x",
      name: "RL Other User",
      role: "tenant_superadmin",
    },
  });
  otherUserId = otherUser.id;
});

afterAll(async () => {
  if (!hasDb) return;
  if (testTenantId) {
    await platformPrisma.fisherfolk.deleteMany({ where: { tenantId: testTenantId } });
    await platformPrisma.auditLog.deleteMany({ where: { tenantId: testTenantId } });
    await platformPrisma.user.deleteMany({ where: { tenantId: testTenantId } });
    await platformPrisma.tenant.delete({ where: { id: testTenantId } }).catch(() => {});
  }
  if (otherTenantId) {
    await platformPrisma.fisherfolk.deleteMany({ where: { tenantId: otherTenantId } });
    await platformPrisma.auditLog.deleteMany({ where: { tenantId: otherTenantId } });
    await platformPrisma.user.deleteMany({ where: { tenantId: otherTenantId } });
    await platformPrisma.tenant.delete({ where: { id: otherTenantId } }).catch(() => {});
  }
});

describe.skipIf(!hasDb)("resetAnnualRegistrations", () => {
  it("expires NEW and RENEWED records, leaves ARCHIVED/EXPIRED untouched, returns matching count", async () => {
    const newFf = await platformPrisma.fisherfolk.create({
      data: {
        tenantId: testTenantId,
        idNumber: "FF-2024-001",
        fullName: "New Record",
        lastName: "Record",
        firstName: "New",
        address: "Addr",
        barangay: "Bgry",
        registrationYear: 2024,
        status: "NEW",
        createdById: testUserId,
        updatedById: testUserId,
      },
    });
    const renewedFf = await platformPrisma.fisherfolk.create({
      data: {
        tenantId: testTenantId,
        idNumber: "FF-2024-002",
        fullName: "Renewed Record",
        lastName: "Record",
        firstName: "Renewed",
        address: "Addr",
        barangay: "Bgry",
        registrationYear: 2024,
        status: "RENEWED",
        createdById: testUserId,
        updatedById: testUserId,
      },
    });
    const archivedFf = await platformPrisma.fisherfolk.create({
      data: {
        tenantId: testTenantId,
        idNumber: "FF-2024-003",
        fullName: "Archived Record",
        lastName: "Record",
        firstName: "Archived",
        address: "Addr",
        barangay: "Bgry",
        registrationYear: 2024,
        status: "ARCHIVED",
        createdById: testUserId,
        updatedById: testUserId,
      },
    });
    const expiredFf = await platformPrisma.fisherfolk.create({
      data: {
        tenantId: testTenantId,
        idNumber: "FF-2024-004",
        fullName: "Already Expired",
        lastName: "Record",
        firstName: "Already",
        address: "Addr",
        barangay: "Bgry",
        registrationYear: 2024,
        status: "EXPIRED",
        createdById: testUserId,
        updatedById: testUserId,
      },
    });

    const result = await resetAnnualRegistrations(prisma, testTenantId, testUserId);
    expect(result.count).toBe(2);

    const [updatedNew, updatedRenewed, untouchedArchived, untouchedExpired] =
      await Promise.all([
        platformPrisma.fisherfolk.findUnique({ where: { id: newFf.id } }),
        platformPrisma.fisherfolk.findUnique({ where: { id: renewedFf.id } }),
        platformPrisma.fisherfolk.findUnique({ where: { id: archivedFf.id } }),
        platformPrisma.fisherfolk.findUnique({ where: { id: expiredFf.id } }),
      ]);
    expect(updatedNew?.status).toBe("EXPIRED");
    expect(updatedRenewed?.status).toBe("EXPIRED");
    expect(untouchedArchived?.status).toBe("ARCHIVED");
    expect(untouchedExpired?.status).toBe("EXPIRED");

    const auditRows = await platformPrisma.auditLog.findMany({
      where: { tenantId: testTenantId, action: "EXPIRE" },
    });
    expect(auditRows).toHaveLength(1);

    await platformPrisma.fisherfolk.deleteMany({
      where: {
        id: { in: [newFf.id, renewedFf.id, archivedFf.id, expiredFf.id] },
      },
    });
  });

  it("is idempotent — second call returns count 0", async () => {
    const ff = await platformPrisma.fisherfolk.create({
      data: {
        tenantId: testTenantId,
        idNumber: "FF-2024-005",
        fullName: "Idem Test",
        lastName: "Test",
        firstName: "Idem",
        address: "Addr",
        barangay: "Bgry",
        registrationYear: 2024,
        status: "RENEWED",
        createdById: testUserId,
        updatedById: testUserId,
      },
    });

    await resetAnnualRegistrations(prisma, testTenantId, testUserId);
    const second = await resetAnnualRegistrations(prisma, testTenantId, testUserId);
    expect(second.count).toBe(0);

    await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
  });

  it("is tenant-isolated — does not touch another tenant's records", async () => {
    const otherFf = await platformPrisma.fisherfolk.create({
      data: {
        tenantId: otherTenantId,
        idNumber: "FF-OTHER-001",
        fullName: "Other Tenant Record",
        lastName: "Record",
        firstName: "Other",
        address: "Addr",
        barangay: "Bgry",
        registrationYear: 2024,
        status: "NEW",
        createdById: otherUserId,
        updatedById: otherUserId,
      },
    });

    const result = await resetAnnualRegistrations(prisma, testTenantId, testUserId);
    expect(result.count).toBe(0);

    const untouched = await platformPrisma.fisherfolk.findUnique({
      where: { id: otherFf.id },
    });
    expect(untouched?.status).toBe("NEW");

    await platformPrisma.fisherfolk.delete({ where: { id: otherFf.id } });
  });
});
