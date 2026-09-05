/**
 * Integration tests — mobileAuth tRPC router + bearer-token context
 * resolution (FIS-37).
 *
 * DB-integration: requires DATABASE_URL + AUTH_SECRET from .env.dev. CI
 * skips (no DB). Run locally:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/trpc/routers/mobileAuth.test.ts
 *
 * Uses platformPrisma for setup/teardown (bypasses tenant guard extension).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";

import { platformPrisma, prisma } from "@frms/db";

import { resolveMobileTRPCContext } from "../mobile-context";
import { createCallerFactory } from "../trpc";
import { mobileAuthRouter } from "./mobileAuth";
import type { TRPCContext } from "../context";

// ─── DB gate ─────────────────────────────────────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL) && Boolean(process.env.AUTH_SECRET);

// ─── Unique run suffix ────────────────────────────────────────────────────────

const RUN = Date.now().toString(36);
const SLUG_A = `ma-test-a-${RUN}`;
const SLUG_B = `ma-test-b-${RUN}`;
const PASSWORD = "correct-horse-battery-staple";

// ─── Shared state ─────────────────────────────────────────────────────────────

let tenantAId: string;
let tenantBId: string;
let activeUserId: string;
let inactiveUserId: string;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const callerFactory = createCallerFactory(mobileAuthRouter);

function makePublicReq(): Request {
  return new Request("http://localhost/api/trpc/mobileAuth.login", {
    headers: { "x-forwarded-for": "127.0.0.1" },
  });
}

function loginCaller() {
  return callerFactory({
    session: null,
    userId: null,
    role: null,
    tenantId: null,
    tenantSlug: null,
    db: prisma,
    req: makePublicReq(),
  });
}

function toFullCtx(mobile: NonNullable<Awaited<ReturnType<typeof resolveMobileTRPCContext>>>): TRPCContext {
  return {
    ...mobile,
    db: prisma,
    req: new Request("http://localhost/api/trpc/mobileAuth.me"),
  };
}

describe.skipIf(!hasDb)("mobileAuth router", () => {
  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    const tenantA = await platformPrisma.tenant.create({
      data: {
        name: "Mobile Auth Test Tenant A",
        slug: SLUG_A,
        status: "ACTIVE",
        currentRegistrationYear: new Date().getFullYear(),
      },
    });
    tenantAId = tenantA.id;

    const tenantB = await platformPrisma.tenant.create({
      data: {
        name: "Mobile Auth Test Tenant B",
        slug: SLUG_B,
        status: "ACTIVE",
        currentRegistrationYear: new Date().getFullYear(),
      },
    });
    tenantBId = tenantB.id;

    const activeUser = await platformPrisma.user.create({
      data: {
        tenantId: tenantAId,
        email: `ma-active-${RUN}@local`,
        username: `ma-active-${RUN}`,
        passwordHash,
        name: "Mobile Active User",
        role: "encoder",
        status: "ACTIVE",
      },
    });
    activeUserId = activeUser.id;

    const inactiveUser = await platformPrisma.user.create({
      data: {
        tenantId: tenantAId,
        email: `ma-inactive-${RUN}@local`,
        username: `ma-inactive-${RUN}`,
        passwordHash,
        name: "Mobile Inactive User",
        role: "encoder",
        status: "DEACTIVATED",
      },
    });
    inactiveUserId = inactiveUser.id;
  });

  afterAll(async () => {
    if (!tenantAId && !tenantBId) return;
    await platformPrisma.user.deleteMany({
      where: { tenantId: { in: [tenantAId, tenantBId].filter(Boolean) } },
    });
    await platformPrisma.tenant
      .deleteMany({ where: { id: { in: [tenantAId, tenantBId].filter(Boolean) } } })
      .catch(() => {
        /* already gone */
      });
  });

  it("issues a bearer token on valid credentials", async () => {
    const caller = loginCaller();
    const result = await caller.login({
      orgSlug: SLUG_A,
      username: `ma-active-${RUN}`,
      password: PASSWORD,
    });

    expect(typeof result.token).toBe("string");
    expect(result.token.split(".")).toHaveLength(3);
    expect(result.user.id).toBe(activeUserId);
    expect(result.user.tenantSlug).toBe(SLUG_A);
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects a wrong password with a generic UNAUTHORIZED error", async () => {
    const caller = loginCaller();
    await expect(
      caller.login({
        orgSlug: SLUG_A,
        username: `ma-active-${RUN}`,
        password: "totally-wrong-password",
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid username, password, or tenant.",
    });
  });

  it("rejects an unknown username with the SAME generic error", async () => {
    const caller = loginCaller();
    await expect(
      caller.login({
        orgSlug: SLUG_A,
        username: `no-such-user-${RUN}`,
        password: PASSWORD,
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid username, password, or tenant.",
    });
  });

  it("rejects an inactive (DEACTIVATED) user with the SAME generic error", async () => {
    expect(inactiveUserId).toBeTruthy(); // sanity — seeded in beforeAll
    const caller = loginCaller();
    await expect(
      caller.login({
        orgSlug: SLUG_A,
        username: `ma-inactive-${RUN}`,
        password: PASSWORD,
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid username, password, or tenant.",
    });
  });

  it("a bearer token authenticates the tRPC context to the correct userId/role/tenantId", async () => {
    const { token } = await loginCaller().login({
      orgSlug: SLUG_A,
      username: `ma-active-${RUN}`,
      password: PASSWORD,
    });

    const mobile = await resolveMobileTRPCContext(`Bearer ${token}`);
    expect(mobile).not.toBeNull();
    if (!mobile) throw new Error("unreachable");

    expect(mobile.userId).toBe(activeUserId);
    expect(mobile.role).toBe("encoder");
    expect(mobile.tenantId).toBe(tenantAId);
    expect(mobile.tenantSlug).toBe(SLUG_A);

    // Reachable via the actual `me` procedure too — proves
    // `resolveMobileTRPCContext`'s output is a real, working `TRPCContext`.
    const meCaller = callerFactory(toFullCtx(mobile));
    const me = await meCaller.me();
    expect(me.id).toBe(activeUserId);
    expect(me.tenantId).toBe(tenantAId);
  });

  it("REJECTS a token whose securityVersion is stale after a bump (revocation)", async () => {
    const { token } = await loginCaller().login({
      orgSlug: SLUG_A,
      username: `ma-active-${RUN}`,
      password: PASSWORD,
    });

    // Simulate a revocation event (password change / role change / manual
    // "log out everywhere") — bumps securityVersion, invalidating every
    // previously issued token for this user.
    await platformPrisma.user.update({
      where: { id: activeUserId },
      data: { securityVersion: { increment: 1 } },
    });

    const mobile = await resolveMobileTRPCContext(`Bearer ${token}`);
    expect(mobile).toBeNull();

    // Restore for any later assertions in this file.
    await platformPrisma.user.update({
      where: { id: activeUserId },
      data: { securityVersion: 1 },
    });
  });

  it("tenant isolation — a token cannot resolve into a DIFFERENT tenant's context", async () => {
    const { token } = await loginCaller().login({
      orgSlug: SLUG_A,
      username: `ma-active-${RUN}`,
      password: PASSWORD,
    });

    const mobile = await resolveMobileTRPCContext(`Bearer ${token}`);
    expect(mobile).not.toBeNull();

    // The resolved tenant is ALWAYS this token owner's real (DB) tenant —
    // never tenant B, and never anything a client could influence.
    expect(mobile?.tenantId).toBe(tenantAId);
    expect(mobile?.tenantId).not.toBe(tenantBId);
  });
});
