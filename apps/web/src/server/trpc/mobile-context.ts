/**
 * Bearer-token → tRPC context resolution (FIS-37), extracted out of
 * `context.ts` into its OWN module that never imports `../auth`
 * (`./index.ts`/Auth.js) — only `../auth/mobile-token` (pure `jose`, no
 * Next.js runtime dependency) + the Prisma client.
 *
 * WHY this is a separate file: `../auth` (the Node Auth.js instance) pulls
 * in `next-auth`, which in turn imports Next.js's `next/server` — a module
 * that only resolves inside an actual Next.js build/runtime, NOT under
 * Vitest's plain Node environment. Every existing integration test in this
 * codebase avoids importing `../context`'s *value* export for that exact
 * reason (see `kanbanTask.test.ts`, which imports `TRPCContext` as a
 * TYPE-only import). Isolating the bearer-token path here lets it be
 * exercised directly in tests without dragging in next-auth's runtime.
 */
import { platformPrisma } from "@frms/db";
import type { Session } from "next-auth";
import type { UserRole } from "@frms/shared/types";

import { verifyMobileToken } from "../auth/mobile-token";

export type MobileTRPCContext = {
  session: Session;
  userId: string;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
};

/**
 * Resolves a `MobileTRPCContext` from a mobile `Authorization: Bearer
 * <token>` header value (the FULL header value, e.g. `"Bearer eyJ..."`).
 *
 * FAIL-CLOSED: returns `null` (never a partial/degraded context) on ANY of
 * — bad signature, expired token, malformed claims, unknown/inactive user,
 * suspended tenant, or a `securityVersion` that no longer matches the
 * user's CURRENT DB row (password change / role change / manual
 * revocation all bump `securityVersion`, invalidating every previously
 * issued bearer token — same posture as the web cookie session's V28
 * hardening in `../auth/index.ts`).
 *
 * `tenantId`/`role` are always read from the freshly-loaded DB row, NEVER
 * from the token's claims directly and NEVER from client input — this is
 * the tenant-isolation guarantee for the bearer-token path.
 */
export async function resolveMobileTRPCContext(
  authHeader: string,
): Promise<MobileTRPCContext | null> {
  const token = authHeader.slice("Bearer ".length).trim();
  if (token.length === 0) return null;

  let claims;
  try {
    claims = await verifyMobileToken(token);
  } catch {
    return null;
  }

  const dbUser = await platformPrisma.user.findUnique({
    where: { id: claims.sub },
    include: { tenant: true },
  });

  if (!dbUser || dbUser.status !== "ACTIVE") return null;
  if (dbUser.securityVersion !== claims.sv) return null;
  if (dbUser.tenant?.status === "SUSPENDED") return null;

  const tenantId = dbUser.tenantId;
  const tenantSlug = dbUser.tenant?.slug ?? null;

  const session: Session = {
    user: {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      tenantId,
      tenantSlug,
      securityVersion: dbUser.securityVersion,
    },
    expires: new Date(claims.exp * 1000).toISOString(),
  };

  return {
    session,
    userId: dbUser.id,
    role: dbUser.role,
    tenantId,
    tenantSlug,
  };
}
