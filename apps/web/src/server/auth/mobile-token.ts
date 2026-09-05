/**
 * Mobile bearer-token issuance + verification (FIS-37).
 *
 * A signed, stateless JWT (HS256, same `AUTH_SECRET` the web Auth.js
 * instance already uses — see `./config.ts`) that a future mobile client
 * carries as `Authorization: Bearer <token>` instead of a web session
 * cookie. This module is Node-runtime only (imported from `../trpc/
 * context.ts` and `../trpc/routers/mobileAuth.ts`, never from `./edge.ts`
 * or middleware).
 *
 * SECURITY CONTRACT
 *   - `sv` (securityVersion) is embedded at issuance and MUST be
 *     re-compared against the user's CURRENT DB securityVersion on every
 *     verify (done by the CALLER — see `context.ts` — not here, since this
 *     module has no DB access). A stale `sv` means the token must be
 *     rejected: password change / role change / manual revocation all bump
 *     `securityVersion`, which invalidates every previously-issued token.
 *   - `tid`/`role` are claims signed into the token at issuance time from a
 *     DB-verified user — a caller must NEVER accept a client-supplied
 *     tenantId/role instead of these claims.
 *   - Verification enforces signature + expiry (`jose` throws on either
 *     failure) — see `verifyMobileToken`.
 */
import { SignJWT, jwtVerify, errors as joseErrors } from "jose";

import type { UserRole } from "@frms/shared/types";

const ALG = "HS256";
const MOBILE_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? "";
  if (secret.length === 0) {
    throw new Error("AUTH_SECRET is not configured — cannot sign/verify mobile tokens");
  }
  return new TextEncoder().encode(secret);
}

export type MobileTokenUser = {
  id: string;
  tenantId: string | null;
  tenantSlug: string | null;
  role: UserRole;
  securityVersion: number;
};

export type MobileTokenClaims = {
  /** userId */
  sub: string;
  /** tenantId */
  tid: string | null;
  /** tenantSlug */
  slug: string | null;
  role: UserRole;
  /** securityVersion at issuance */
  sv: number;
  iat: number;
  exp: number;
};

export type IssuedMobileToken = {
  token: string;
  expiresAt: Date;
};

/** Signs a new 30-day bearer token for an already-authenticated user. */
export async function issueMobileToken(
  user: MobileTokenUser,
): Promise<IssuedMobileToken> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expSeconds = nowSeconds + MOBILE_TOKEN_TTL_SECONDS;

  const token = await new SignJWT({
    tid: user.tenantId,
    slug: user.tenantSlug,
    role: user.role,
    sv: user.securityVersion,
  })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.id)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(expSeconds)
    .sign(getSecretKey());

  return { token, expiresAt: new Date(expSeconds * 1000) };
}

/**
 * Verifies signature + expiry and returns the decoded claims, or throws on
 * ANY failure (bad signature, expired, malformed, wrong alg). Does NOT
 * check DB securityVersion/user-status — the caller must do that (it has
 * no DB client here by design, keeping this module dependency-light).
 */
export async function verifyMobileToken(
  token: string,
): Promise<MobileTokenClaims> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    algorithms: [ALG],
  });

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("INVALID_TOKEN");
  }
  if (typeof payload.sv !== "number") {
    throw new Error("INVALID_TOKEN");
  }
  if (typeof payload.role !== "string") {
    throw new Error("INVALID_TOKEN");
  }

  return {
    sub: payload.sub,
    tid: (payload.tid as string | null | undefined) ?? null,
    slug: (payload.slug as string | null | undefined) ?? null,
    role: payload.role as UserRole,
    sv: payload.sv,
    iat: payload.iat ?? 0,
    exp: payload.exp ?? 0,
  };
}

/** Re-exported so callers can distinguish "expired" from other jose errors
 * without importing `jose` directly. */
export const MobileTokenErrors = joseErrors;
