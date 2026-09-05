/**
 * Integration tests — agenda tRPC router (FIS-35 calendar of activities)
 * (myAgenda visibility streams, date-range filtering, mineOnly, tenant
 * isolation, announce RBAC gate, share validation)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/agenda.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — protectedProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads. Mirrors the setup
 * pattern in kanbanTask.test.ts.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";
import type { UserRole } from "@frms/shared/types";

import type { TRPCContext } from "../context";
import { agendaRouter } from "./agenda";
import { createCallerFactory } from "../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG = `ag-test-${RUN}`;
const OTHER_SLUG = `ag-test-other-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantId: string;
let otherTenantId: string;
let testUserId: string; // self — assigned tasks + assignee for the "self" stream
let sharedWithUserId: string; // gets a KanbanTaskShare — "shared" stream
let unrelatedUserId: string; // no assignment/share/announce visibility
let viewerUserId: string;
let encoderUserId: string;
let tenantAdminUserId: string;
let otherTenantUserId: string; // lives in otherTenantId

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(userId: string, tenantId: string, tenantSlug: string, role: UserRole = "tenant_superadmin"): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Test User", email: "agtest@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId,
    role,
    tenantId,
    tenantSlug,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(agendaRouter);
const caller = (
  userId: string,
  role: UserRole = "tenant_superadmin",
  tenantId: string = testTenantId,
  tenantSlug: string = SLUG,
) => callerFactory(makeCtx(userId, tenantId, tenantSlug, role));

let ffSeq = 0;
async function makeFisherfolk(tenantId: string, createdById: string) {
  ffSeq += 1;
  const n = ffSeq;
  return platformPrisma.fisherfolk.create({
    data: {
      tenantId,
      idNumber: `AGFF-${RUN}-${n}`,
      fullName: `AGTok${RUN} Fisher ${n}`,
      lastName: `Fisher${n}`,
      firstName: "Test",
      address: `${n} Test St`,
      barangay: "Barangay Test",
      categoryIds: [],
      registrationYear: new Date().getFullYear(),
      createdById,
      updatedById: createdById,
    },
  });
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

async function wipeTenant(slug: string) {
  const existing = await platformPrisma.tenant.findUnique({ where: { slug } });
  if (!existing) return;
  await platformPrisma.kanbanTaskShare.deleteMany({ where: { tenantId: existing.id } });
  await platformPrisma.kanbanTask.deleteMany({ where: { tenantId: existing.id } });
  await platformPrisma.fisherfolk.deleteMany({ where: { tenantId: existing.id } });
  await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
  await platformPrisma.tenant.delete({ where: { id: existing.id } });
}

beforeAll(async () => {
  if (!hasDb) return;

  await wipeTenant(SLUG);
  await wipeTenant(OTHER_SLUG);

  const tenant = await platformPrisma.tenant.create({
    data: {
      name: "Agenda Test Tenant",
      slug: SLUG,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantId = tenant.id;

  const otherTenant = await platformPrisma.tenant.create({
    data: {
      name: "Agenda Other Tenant",
      slug: OTHER_SLUG,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  otherTenantId = otherTenant.id;

  const mkUser = (email: string, role: UserRole, tenantId: string) =>
    platformPrisma.user.create({
      data: {
        tenantId,
        email: `${email}-${RUN}@local`,
        username: `${email}-${RUN}`,
        passwordHash: "not-real",
        name: email,
        role,
      },
    });

  testUserId = (await mkUser("ag-self", "tenant_superadmin", testTenantId)).id;
  sharedWithUserId = (await mkUser("ag-shared", "encoder", testTenantId)).id;
  unrelatedUserId = (await mkUser("ag-unrelated", "encoder", testTenantId)).id;
  viewerUserId = (await mkUser("ag-viewer", "viewer", testTenantId)).id;
  encoderUserId = (await mkUser("ag-encoder", "encoder", testTenantId)).id;
  tenantAdminUserId = (await mkUser("ag-tenantadmin", "tenant_admin", testTenantId)).id;
  otherTenantUserId = (await mkUser("ag-other-tenant", "tenant_superadmin", otherTenantId)).id;
});

afterAll(async () => {
  if (!hasDb) return;
  await wipeTenant(SLUG);
  await wipeTenant(OTHER_SLUG);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("agenda.myAgenda — visibility streams", () => {
  const RANGE_FROM = new Date("2026-08-01T00:00:00.000Z");
  const RANGE_TO = new Date("2026-08-31T23:59:59.999Z");
  const IN_RANGE = new Date("2026-08-15T09:00:00.000Z");

  it("a task assigned to self appears with stream 'self'", async () => {
    const created = await caller(testUserId, "tenant_superadmin", testTenantId, SLUG).create({
      title: `Self task ${RUN}`,
      startAt: IN_RANGE,
    });

    const rows = await caller(testUserId, "tenant_superadmin", testTenantId, SLUG).myAgenda({
      from: RANGE_FROM,
      to: RANGE_TO,
    });

    const row = rows.find((r) => r.id === created.id);
    expect(row).toBeDefined();
    expect(row!.stream).toBe("self");
  });

  it("sharing a task makes it appear for the shared user with stream 'shared', not for an unrelated user", async () => {
    const created = await caller(testUserId).create({
      title: `Shared task ${RUN}`,
      startAt: IN_RANGE,
    });
    await caller(testUserId).share({
      taskId: created.id,
      userIds: [sharedWithUserId],
    });

    const sharedRows = await caller(sharedWithUserId, "encoder").myAgenda({
      from: RANGE_FROM,
      to: RANGE_TO,
    });
    const sharedRow = sharedRows.find((r) => r.id === created.id);
    expect(sharedRow).toBeDefined();
    expect(sharedRow!.stream).toBe("shared");

    const unrelatedRows = await caller(unrelatedUserId, "encoder").myAgenda({
      from: RANGE_FROM,
      to: RANGE_TO,
    });
    expect(unrelatedRows.some((r) => r.id === created.id)).toBe(false);
  });

  it("an ANNOUNCED task appears for every tenant user with stream 'announced'", async () => {
    const created = await caller(testUserId).create({
      title: `Announced task ${RUN}`,
      startAt: IN_RANGE,
      audience: "ANNOUNCED",
    });

    for (const [userId, role] of [
      [testUserId, "tenant_superadmin"],
      [unrelatedUserId, "encoder"],
      [viewerUserId, "viewer"],
    ] as const) {
      const rows = await caller(userId, role).myAgenda({
        from: RANGE_FROM,
        to: RANGE_TO,
      });
      const row = rows.find((r) => r.id === created.id);
      expect(row).toBeDefined();
      expect(row!.stream).toBe("announced");
    }
  });

  it("a task linked to a source entity appears with stream 'entity' for its assignee", async () => {
    const ff = await makeFisherfolk(testTenantId, testUserId);
    const created = await caller(testUserId).create({
      title: `Entity task ${RUN}`,
      startAt: IN_RANGE,
      sourceEntityType: "fisherfolk",
      sourceEntityId: ff.id,
    });

    const rows = await caller(testUserId).myAgenda({
      from: RANGE_FROM,
      to: RANGE_TO,
    });
    const row = rows.find((r) => r.id === created.id);
    expect(row).toBeDefined();
    expect(row!.stream).toBe("entity");
  });
});

describe.skipIf(!hasDb)("agenda.myAgenda — date-range boundaries", () => {
  const RANGE_FROM = new Date("2026-09-01T00:00:00.000Z");
  const RANGE_TO = new Date("2026-09-30T23:59:59.999Z");

  it("a task with startAt inside the range is returned; one outside is not", async () => {
    const inside = await caller(testUserId).create({
      title: `In range ${RUN}`,
      startAt: new Date("2026-09-15T00:00:00.000Z"),
    });
    const outside = await caller(testUserId).create({
      title: `Out of range ${RUN}`,
      startAt: new Date("2026-10-15T00:00:00.000Z"),
    });

    const rows = await caller(testUserId).myAgenda({
      from: RANGE_FROM,
      to: RANGE_TO,
    });
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(inside.id);
    expect(ids).not.toContain(outside.id);
  });

  it("a task with startAt=null falls back to dueDate for range matching", async () => {
    const created = await caller(testUserId).create({
      title: `Due-date fallback ${RUN}`,
      dueDate: new Date("2026-09-20T00:00:00.000Z"),
    });

    const rows = await caller(testUserId).myAgenda({
      from: RANGE_FROM,
      to: RANGE_TO,
    });
    expect(rows.map((r) => r.id)).toContain(created.id);
  });
});

describe.skipIf(!hasDb)("agenda.myAgenda — mineOnly", () => {
  const RANGE_FROM = new Date("2026-11-01T00:00:00.000Z");
  const RANGE_TO = new Date("2026-11-30T23:59:59.999Z");
  const IN_RANGE = new Date("2026-11-10T00:00:00.000Z");

  it("mineOnly=true excludes shared and announced tasks, returning only self-assigned", async () => {
    const mine = await caller(testUserId).create({
      title: `Mine only ${RUN}`,
      startAt: IN_RANGE,
    });
    const shared = await caller(testUserId).create({
      title: `Shared not mine ${RUN}`,
      startAt: IN_RANGE,
    });
    await caller(testUserId).share({
      taskId: shared.id,
      userIds: [sharedWithUserId],
    });
    const announced = await caller(testUserId).create({
      title: `Announced not mine ${RUN}`,
      startAt: IN_RANGE,
      audience: "ANNOUNCED",
    });

    const rows = await caller(sharedWithUserId, "encoder").myAgenda({
      from: RANGE_FROM,
      to: RANGE_TO,
      mineOnly: true,
    });
    const ids = rows.map((r) => r.id);
    expect(ids).not.toContain(mine.id);
    expect(ids).not.toContain(shared.id);
    expect(ids).not.toContain(announced.id);
  });
});

describe.skipIf(!hasDb)("agenda.myAgenda — tenant isolation", () => {
  it("a task in tenant X never appears in myAgenda for a user in tenant Y", async () => {
    const from = new Date("2026-12-01T00:00:00.000Z");
    const to = new Date("2026-12-31T23:59:59.999Z");

    const created = await caller(testUserId).create({
      title: `Tenant X task ${RUN}`,
      startAt: new Date("2026-12-10T00:00:00.000Z"),
      audience: "ANNOUNCED",
    });

    const otherTenantRows = await caller(
      otherTenantUserId,
      "tenant_superadmin",
      otherTenantId,
      OTHER_SLUG,
    ).myAgenda({ from, to });

    expect(otherTenantRows.some((r) => r.id === created.id)).toBe(false);
  });
});

describe.skipIf(!hasDb)("agenda announce RBAC gate", () => {
  it("create with audience=ANNOUNCED throws FORBIDDEN for a viewer", async () => {
    await expect(
      caller(viewerUserId, "viewer").create({
        title: `Viewer announce attempt ${RUN}`,
        audience: "ANNOUNCED",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("create with audience=ANNOUNCED succeeds for encoder and tenant_admin", async () => {
    const byEncoder = await caller(encoderUserId, "encoder").create({
      title: `Encoder announce ${RUN}`,
      audience: "ANNOUNCED",
    });
    expect(byEncoder.audience).toBe("ANNOUNCED");

    const byTenantAdmin = await caller(tenantAdminUserId, "tenant_admin").create({
      title: `Tenant admin announce ${RUN}`,
      audience: "ANNOUNCED",
    });
    expect(byTenantAdmin.audience).toBe("ANNOUNCED");
  });

  it("announce() throws FORBIDDEN for a viewer, succeeds for encoder", async () => {
    const task = await caller(testUserId).create({
      title: `To be announced ${RUN}`,
    });

    await expect(
      caller(viewerUserId, "viewer").announce({ taskId: task.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const announced = await caller(encoderUserId, "encoder").announce({
      taskId: task.id,
    });
    expect(announced.audience).toBe("ANNOUNCED");
  });

  it("setAudience(ANNOUNCED) throws FORBIDDEN for a viewer, succeeds for tenant_admin", async () => {
    const task = await caller(testUserId).create({
      title: `Set audience target ${RUN}`,
    });

    await expect(
      caller(viewerUserId, "viewer").setAudience({
        taskId: task.id,
        audience: "ANNOUNCED",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const updated = await caller(tenantAdminUserId, "tenant_admin").setAudience({
      taskId: task.id,
      audience: "ANNOUNCED",
    });
    expect(updated.audience).toBe("ANNOUNCED");
  });
});

describe.skipIf(!hasDb)("agenda.share — validation", () => {
  it("rejects sharing to a userId outside the tenant", async () => {
    const task = await caller(testUserId).create({
      title: `Share validation target ${RUN}`,
    });

    await expect(
      caller(testUserId).share({
        taskId: task.id,
        userIds: [otherTenantUserId],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
