/**
 * Integration tests — kanbanTask tRPC router (ToDo feature)
 * (create dueDate/source link / default assignee / list filters)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/kanbanTask.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — protectedProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../context";
import { kanbanTaskRouter } from "./kanbanTask";
import { createCallerFactory } from "../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG = `kt-test-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantId: string;
let testUserId: string;
let otherUserId: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(userId: string): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Test Admin", email: "admin@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId,
    role: "admin",
    tenantId: testTenantId,
    tenantSlug: SLUG,
    db: prisma,
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(kanbanTaskRouter);
const caller = (userId: string) => callerFactory(makeCtx(userId));

let ffSeq = 0;
async function makeFisherfolk(overrides: Record<string, unknown> = {}) {
  ffSeq += 1;
  const n = ffSeq;
  return platformPrisma.fisherfolk.create({
    data: {
      tenantId: testTenantId,
      idNumber: `KTFF-${RUN}-${n}`,
      fullName: `KTTok${RUN} Fisher ${n}`,
      lastName: `Fisher${n}`,
      firstName: "Test",
      address: `${n} Test St`,
      barangay: "Barangay Test",
      categoryIds: [],
      registrationYear: new Date().getFullYear(),
      createdById: testUserId,
      updatedById: testUserId,
      ...overrides,
    },
  });
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  const existing = await platformPrisma.tenant.findUnique({
    where: { slug: SLUG },
  });
  if (existing) {
    await platformPrisma.kanbanTask.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.fisherfolk.deleteMany({
      where: { tenantId: existing.id },
    });
    await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
    await platformPrisma.tenant.delete({ where: { id: existing.id } });
  }

  const tenant = await platformPrisma.tenant.create({
    data: {
      name: "KT Test Tenant",
      slug: SLUG,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantId = tenant.id;

  const user = await platformPrisma.user.create({
    data: {
      tenantId: testTenantId,
      email: `kt-admin-${RUN}@local`,
      username: `kt-admin-${RUN}`,
      passwordHash: "not-real",
      name: "Test Admin",
      role: "admin",
    },
  });
  testUserId = user.id;

  const other = await platformPrisma.user.create({
    data: {
      tenantId: testTenantId,
      email: `kt-other-${RUN}@local`,
      username: `kt-other-${RUN}`,
      passwordHash: "not-real",
      name: "Other User",
      role: "encoder",
    },
  });
  otherUserId = other.id;
});

afterAll(async () => {
  if (!hasDb) return;
  if (!testTenantId) return;

  await platformPrisma.kanbanTask.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.fisherfolk.deleteMany({
    where: { tenantId: testTenantId },
  });
  await platformPrisma.user.deleteMany({ where: { tenantId: testTenantId } });
  await platformPrisma.tenant
    .delete({ where: { id: testTenantId } })
    .catch(() => {
      /* already gone */
    });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("kanbanTask.create", () => {
  it("records dueDate + sourceEntityType/Id when linked to a real fisherfolk", async () => {
    const ff = await makeFisherfolk();

    const created = await caller(testUserId).create({
      title: "Follow up with fisherfolk",
      dueDate: new Date("2026-08-01T00:00:00.000Z"),
      sourceEntityType: "fisherfolk",
      sourceEntityId: ff.id,
    });

    const task = await platformPrisma.kanbanTask.findUnique({
      where: { id: created.id },
    });
    expect(task).not.toBeNull();
    expect(task!.dueDate?.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(task!.sourceEntityType).toBe("fisherfolk");
    expect(task!.sourceEntityId).toBe(ff.id);
  });

  it("defaults assignedToId to the calling user when omitted", async () => {
    const created = await caller(testUserId).create({
      title: "Task with no explicit assignee",
    });

    const task = await platformPrisma.kanbanTask.findUnique({
      where: { id: created.id },
    });
    expect(task!.assignedToId).toBe(testUserId);
  });

  it("rejects a sourceEntityId that does not resolve in-tenant", async () => {
    await expect(
      caller(testUserId).create({
        title: "Bad source link",
        sourceEntityType: "fisherfolk",
        sourceEntityId: "clxxxxxxxxxxxxxxxxxxxxxxx",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe.skipIf(!hasDb)("kanbanTask.list", () => {
  it("assignedToMe filters to the calling user's tasks", async () => {
    await caller(testUserId).create({ title: `Mine ${RUN}` });
    await caller(otherUserId).create({ title: `Not mine ${RUN}` });

    const mine = await caller(testUserId).list({ assignedToMe: true });
    expect(mine.items.every((t) => t.title !== `Not mine ${RUN}`)).toBe(true);
    expect(mine.items.some((t) => t.title === `Mine ${RUN}`)).toBe(true);

    const others = await caller(otherUserId).list({ assignedToMe: true });
    expect(others.items.some((t) => t.title === `Not mine ${RUN}`)).toBe(
      true,
    );
    expect(others.items.every((t) => t.title !== `Mine ${RUN}`)).toBe(true);
  });

  it("filters by sourceEntityType + sourceEntityId", async () => {
    const linked = await makeFisherfolk();
    const unlinked = await makeFisherfolk();

    const withSource = await caller(testUserId).create({
      title: `Linked todo ${RUN}`,
      sourceEntityType: "fisherfolk",
      sourceEntityId: linked.id,
    });
    await caller(testUserId).create({
      title: `Unlinked todo ${RUN}`,
      sourceEntityType: "fisherfolk",
      sourceEntityId: unlinked.id,
    });

    const results = await caller(testUserId).list({
      sourceEntityType: "fisherfolk",
      sourceEntityId: linked.id,
    });

    expect(results.items.map((t) => t.id)).toEqual([withSource.id]);
  });
});
