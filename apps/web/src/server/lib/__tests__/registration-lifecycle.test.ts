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
});

afterAll(async () => {
  if (!hasDb || !testTenantId) return;
  await platformPrisma.fisherfolk.deleteMany({ where: { tenantId: testTenantId } });
  await platformPrisma.user.deleteMany({ where: { tenantId: testTenantId } });
  await platformPrisma.tenant.delete({ where: { id: testTenantId } }).catch(() => {});
});

describe.skipIf(!hasDb)("resetAnnualRegistrations", () => {
  it("sets ACTIVE records with older registrationYear to INACTIVE", async () => {
    const ff = await platformPrisma.fisherfolk.create({
      data: {
        tenantId: testTenantId,
        idNumber: "FF-2024-001",
        fullName: "Old Active",
        lastName: "Active",
        firstName: "Old",
        address: "Addr",
        barangay: "Bgry",
        registrationYear: 2024,
        status: "ACTIVE",
        createdById: testUserId,
        updatedById: testUserId,
      },
    });

    const result = await resetAnnualRegistrations(prisma, testTenantId, 2025);
    expect(result.count).toBeGreaterThanOrEqual(1);

    const updated = await platformPrisma.fisherfolk.findUnique({
      where: { id: ff.id },
    });
    expect(updated?.status).toBe("INACTIVE");

    await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
  });

  it("is idempotent — second call returns count 0", async () => {
    const ff = await platformPrisma.fisherfolk.create({
      data: {
        tenantId: testTenantId,
        idNumber: "FF-2024-002",
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

    await resetAnnualRegistrations(prisma, testTenantId, 2025);
    const second = await resetAnnualRegistrations(prisma, testTenantId, 2025);
    expect(second.count).toBe(0);

    await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
  });

  it("does not touch records with registrationYear === currentRegistrationYear", async () => {
    const ff = await platformPrisma.fisherfolk.create({
      data: {
        tenantId: testTenantId,
        idNumber: "FF-2025-001",
        fullName: "Current Active",
        lastName: "Active",
        firstName: "Current",
        address: "Addr",
        barangay: "Bgry",
        registrationYear: 2025,
        status: "ACTIVE",
        createdById: testUserId,
        updatedById: testUserId,
      },
    });

    const result = await resetAnnualRegistrations(prisma, testTenantId, 2025);
    expect(result.count).toBe(0);

    const untouched = await platformPrisma.fisherfolk.findUnique({
      where: { id: ff.id },
    });
    expect(untouched?.status).toBe("ACTIVE");

    await platformPrisma.fisherfolk.delete({ where: { id: ff.id } });
  });
});
