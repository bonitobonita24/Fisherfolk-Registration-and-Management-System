/**
 * Integration tests — note tRPC router (FIS-36 Field Diary, Phase 1)
 * (mandatory stamp gate / back-date+skew window / visibility / author-only
 * mutate / tenant isolation)
 *
 * DB-integration: requires DATABASE_URL from .env.dev. CI skips (no DB).
 * Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/note.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 * Uses prisma (guarded) as ctx.db — protectedProcedure calls runWithTenant()
 * which sets the ALS that the guard extension reads.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import { platformPrisma, prisma } from "@frms/db";

import type { TRPCContext } from "../context";
import { noteRouter } from "./note";
import { createCallerFactory } from "../trpc";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG_A = `note-test-a-${RUN}`;
const SLUG_B = `note-test-b-${RUN}`;

// ─── Shared state ─────────────────────────────────────────────────────────────

let testTenantAId: string;
let testTenantBId: string;

let authorId: string; // tenant A, encoder — the note author
let otherUserId: string; // tenant A, encoder — a different non-admin user
let adminUserId: string; // tenant A, tenant_admin
let tenantBUserId: string; // tenant B, encoder

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(
  userId: string,
  role: TRPCContext["role"],
  tenantId: string,
  tenantSlug: string,
): TRPCContext {
  return {
    session: {
      user: { id: userId, name: "Test User", email: "note-test@local" },
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

const callerFactory = createCallerFactory(noteRouter);

/** tenant-A callers, one per test role */
const asAuthor = () =>
  callerFactory(makeCtx(authorId, "encoder", testTenantAId, SLUG_A));
const asOther = () =>
  callerFactory(makeCtx(otherUserId, "encoder", testTenantAId, SLUG_A));
const asAdmin = () =>
  callerFactory(makeCtx(adminUserId, "tenant_admin", testTenantAId, SLUG_A));
/** tenant-B caller — for cross-tenant isolation checks */
const asTenantB = () =>
  callerFactory(makeCtx(tenantBUserId, "encoder", testTenantBId, SLUG_B));

function baseStamp(overrides: Record<string, unknown> = {}) {
  return {
    latitude: 13.4115,
    longitude: 121.1803,
    locationLabel: "Barangay Test Pier",
    capturedAt: new Date(),
    body: { type: "doc", content: [] },
    bodyText: `Field note ${RUN}`,
    ...overrides,
  };
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!hasDb) return;

  for (const slug of [SLUG_A, SLUG_B]) {
    const existing = await platformPrisma.tenant.findUnique({
      where: { slug },
    });
    if (existing) {
      await platformPrisma.auditLog.deleteMany({
        where: { tenantId: existing.id },
      });
      await platformPrisma.note.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.user.deleteMany({ where: { tenantId: existing.id } });
      await platformPrisma.tenant.delete({ where: { id: existing.id } });
    }
  }

  const tenantA = await platformPrisma.tenant.create({
    data: {
      name: "Note Test Tenant A",
      slug: SLUG_A,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantAId = tenantA.id;

  const tenantB = await platformPrisma.tenant.create({
    data: {
      name: "Note Test Tenant B",
      slug: SLUG_B,
      status: "ACTIVE",
      currentRegistrationYear: new Date().getFullYear(),
    },
  });
  testTenantBId = tenantB.id;

  const author = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `note-author-${RUN}@local`,
      username: `note-author-${RUN}`,
      passwordHash: "not-real",
      name: "Note Author",
      role: "encoder",
    },
  });
  authorId = author.id;

  const other = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `note-other-${RUN}@local`,
      username: `note-other-${RUN}`,
      passwordHash: "not-real",
      name: "Other Encoder",
      role: "encoder",
    },
  });
  otherUserId = other.id;

  const admin = await platformPrisma.user.create({
    data: {
      tenantId: testTenantAId,
      email: `note-admin-${RUN}@local`,
      username: `note-admin-${RUN}`,
      passwordHash: "not-real",
      name: "Tenant Admin",
      role: "tenant_admin",
    },
  });
  adminUserId = admin.id;

  const tenantBUser = await platformPrisma.user.create({
    data: {
      tenantId: testTenantBId,
      email: `note-tb-${RUN}@local`,
      username: `note-tb-${RUN}`,
      passwordHash: "not-real",
      name: "Tenant B User",
      role: "encoder",
    },
  });
  tenantBUserId = tenantBUser.id;
});

afterAll(async () => {
  if (!hasDb) return;

  for (const tenantId of [testTenantAId, testTenantBId]) {
    if (!tenantId) continue;
    await platformPrisma.auditLog.deleteMany({ where: { tenantId } });
    await platformPrisma.note.deleteMany({ where: { tenantId } });
    await platformPrisma.user.deleteMany({ where: { tenantId } });
    await platformPrisma.tenant.delete({ where: { id: tenantId } }).catch(() => {
      /* already gone */
    });
  }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe.skipIf(!hasDb)("note.create — stamp gate", () => {
  it("persists a validly-stamped note", async () => {
    const capturedAt = new Date();
    const created = await asAuthor().create(
      baseStamp({ title: `Valid note ${RUN}`, capturedAt }),
    );

    const row = await platformPrisma.note.findUnique({
      where: { id: created.id },
    });
    expect(row).not.toBeNull();
    expect(row!.bodyText).toBe(`Field note ${RUN}`);
    expect(row!.body).toEqual({ type: "doc", content: [] });
    expect(row!.capturedAt.toISOString()).toBe(capturedAt.toISOString());
    expect(row!.latitude).toBe(13.4115);
    expect(row!.longitude).toBe(121.1803);
    expect(row!.locationLabel).toBe("Barangay Test Pier");
    expect(row!.authorId).toBe(authorId);
    expect(row!.visibility).toBe("private");
  });

  it("rejects a note missing the location stamp (Zod)", async () => {
    const { locationLabel: _drop, ...missingLabel } = baseStamp();
    await expect(
      asAuthor().create(
        missingLabel as unknown as Parameters<
          ReturnType<typeof asAuthor>["create"]
        >[0],
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects capturedAt more than 14 days in the past (gate)", async () => {
    const tooOld = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    await expect(
      asAuthor().create(baseStamp({ capturedAt: tooOld })),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects capturedAt in the future beyond the clock-skew allowance (gate)", async () => {
    const tooFuture = new Date(Date.now() + 60 * 60 * 1000); // +1h, past 5-min skew
    await expect(
      asAuthor().create(baseStamp({ capturedAt: tooFuture })),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe.skipIf(!hasDb)("note.list", () => {
  it("returns only the caller's own notes by default", async () => {
    await asAuthor().create(baseStamp({ title: `Author's own ${RUN}` }));
    await asOther().create(baseStamp({ title: `Other's own ${RUN}` }));

    const mine = await asAuthor().list({ page: 1, limit: 50 });
    expect(mine.items.every((n) => n.author.id === authorId)).toBe(true);
    expect(
      mine.items.some((n) => n.title === `Author's own ${RUN}`),
    ).toBe(true);
    expect(
      mine.items.every((n) => n.title !== `Other's own ${RUN}`),
    ).toBe(true);
  });

  it("lets a tenant_admin see another user's notes via explicit authorId", async () => {
    const created = await asOther().create(
      baseStamp({ title: `Admin-visible ${RUN}` }),
    );

    const seen = await asAdmin().list({
      page: 1,
      limit: 50,
      authorId: otherUserId,
    });
    expect(seen.items.some((n) => n.id === created.id)).toBe(true);
  });
});

describe.skipIf(!hasDb)("note.getById — visibility", () => {
  it("lets the author read their own private note", async () => {
    const created = await asAuthor().create(
      baseStamp({ title: `Private self-read ${RUN}` }),
    );
    const found = await asAuthor().getById({ id: created.id });
    expect(found.id).toBe(created.id);
  });

  it("FORBIDs a different non-admin user reading a private note", async () => {
    const created = await asAuthor().create(
      baseStamp({ title: `Private blocked ${RUN}` }),
    );
    await expect(asOther().getById({ id: created.id })).rejects.toMatchObject(
      { code: "FORBIDDEN" },
    );
  });

  it("lets a different non-admin user read a shared-visibility note", async () => {
    const created = await asAuthor().create(
      baseStamp({ title: `Shared readable ${RUN}`, visibility: "shared" }),
    );
    const found = await asOther().getById({ id: created.id });
    expect(found.id).toBe(created.id);
  });

  it("lets a tenant_admin read another author's private note", async () => {
    const created = await asAuthor().create(
      baseStamp({ title: `Admin cross-read ${RUN}` }),
    );
    const found = await asAdmin().getById({ id: created.id });
    expect(found.id).toBe(created.id);
  });
});

describe.skipIf(!hasDb)("note.update / note.delete — author-only mutate", () => {
  it("the author can update their own note", async () => {
    const created = await asAuthor().create(
      baseStamp({ title: `Author update ${RUN}` }),
    );
    const updated = await asAuthor().update({
      id: created.id,
      title: `Author update — edited ${RUN}`,
    });
    expect(updated.title).toBe(`Author update — edited ${RUN}`);
  });

  it("a different non-admin user is FORBIDDEN from updating", async () => {
    const created = await asAuthor().create(
      baseStamp({ title: `Update blocked ${RUN}` }),
    );
    await expect(
      asOther().update({ id: created.id, title: "Hijacked title" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("a tenant_admin can update another author's note", async () => {
    const created = await asAuthor().create(
      baseStamp({ title: `Admin update ${RUN}` }),
    );
    const updated = await asAdmin().update({
      id: created.id,
      title: `Admin-edited ${RUN}`,
    });
    expect(updated.title).toBe(`Admin-edited ${RUN}`);
  });

  it("the author can delete their own note", async () => {
    const created = await asAuthor().create(
      baseStamp({ title: `Author delete ${RUN}` }),
    );
    const result = await asAuthor().delete({ id: created.id });
    expect(result.success).toBe(true);

    const row = await platformPrisma.note.findUnique({
      where: { id: created.id },
    });
    expect(row).toBeNull();
  });

  it("a different non-admin user is FORBIDDEN from deleting", async () => {
    const created = await asAuthor().create(
      baseStamp({ title: `Delete blocked ${RUN}` }),
    );
    await expect(asOther().delete({ id: created.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("a tenant_admin can delete another author's note", async () => {
    const created = await asAuthor().create(
      baseStamp({ title: `Admin delete ${RUN}` }),
    );
    const result = await asAdmin().delete({ id: created.id });
    expect(result.success).toBe(true);

    const row = await platformPrisma.note.findUnique({
      where: { id: created.id },
    });
    expect(row).toBeNull();
  });
});

describe.skipIf(!hasDb)("note — tenant isolation", () => {
  it("a note in tenant A never appears in tenant B's list/getById", async () => {
    const created = await asAuthor().create(
      baseStamp({ title: `Tenant A only ${RUN}` }),
    );

    const tenantBList = await asTenantB().list({ page: 1, limit: 100 });
    expect(tenantBList.items.every((n) => n.id !== created.id)).toBe(true);

    await expect(
      asTenantB().getById({ id: created.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
