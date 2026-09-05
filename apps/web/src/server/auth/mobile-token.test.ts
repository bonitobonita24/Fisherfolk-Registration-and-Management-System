/**
 * Unit tests — mobile bearer-token issuance + verification (FIS-37).
 *
 * Pure unit tests (no DB) but require `AUTH_SECRET` (>=32 chars) in the
 * environment — same `.env.dev` source step as the DB-gated integration
 * tests:
 *   set -a; source .env.dev; set +a
 *   pnpm -C apps/web exec vitest run src/server/auth/mobile-token.test.ts
 */
import { describe, expect, it } from "vitest";

import { issueMobileToken, verifyMobileToken } from "./mobile-token";

const hasSecret = Boolean(process.env.AUTH_SECRET);

describe.skipIf(!hasSecret)("mobile-token", () => {
  const baseUser = {
    id: "user-123",
    tenantId: "tenant-abc",
    tenantSlug: "calapan-city",
    role: "encoder" as const,
    securityVersion: 1,
  };

  it("round-trips issue → verify with matching claims", async () => {
    const { token, expiresAt } = await issueMobileToken(baseUser);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature

    const claims = await verifyMobileToken(token);
    expect(claims.sub).toBe(baseUser.id);
    expect(claims.tid).toBe(baseUser.tenantId);
    expect(claims.slug).toBe(baseUser.tenantSlug);
    expect(claims.role).toBe(baseUser.role);
    expect(claims.sv).toBe(baseUser.securityVersion);
    expect(claims.exp * 1000).toBe(expiresAt.getTime());
  });

  it("rejects a tampered token (signature mismatch)", async () => {
    const { token } = await issueMobileToken(baseUser);
    const tampered = `${token.slice(0, -2)}xx`;
    await expect(verifyMobileToken(tampered)).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    // Sign directly with an already-past exp to avoid a real 30-day wait.
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiredToken = await new SignJWT({
      tid: baseUser.tenantId,
      slug: baseUser.tenantSlug,
      role: baseUser.role,
      sv: baseUser.securityVersion,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(baseUser.id)
      .setIssuedAt(nowSeconds - 120)
      .setExpirationTime(nowSeconds - 60)
      .sign(secret);

    await expect(verifyMobileToken(expiredToken)).rejects.toThrow();
  });

  it("rejects a malformed token string", async () => {
    await expect(verifyMobileToken("not-a-jwt")).rejects.toThrow();
  });
});
