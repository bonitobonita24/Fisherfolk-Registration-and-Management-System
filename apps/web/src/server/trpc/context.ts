import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { Session } from "next-auth";

import { prisma } from "@frms/db";
import type { UserRole } from "@frms/shared/types";

import { auth } from "../auth";
import { resolveMobileTRPCContext } from "./mobile-context";

export type TRPCContext = {
  session: Session | null;
  userId: string | null;
  role: UserRole | null;
  tenantId: string | null;
  tenantSlug: string | null;
  db: typeof prisma;
  req: Request;
};

/**
 * Resolves the request's identity for BOTH auth paths:
 *   - a mobile `Authorization: Bearer <token>` header (FIS-37) — delegated
 *     to `resolveMobileTRPCContext` (see that module for why the
 *     bearer-token verification is isolated from Auth.js's runtime).
 *   - the default web cookie session (`auth()`, Auth.js v5) — unchanged.
 *
 * A request carrying a Bearer header is NEVER allowed to silently fall
 * back to a cookie session (there normally isn't one on a mobile request
 * anyway); an invalid/expired/stale-securityVersion bearer token resolves
 * to an unauthenticated context, and downstream `protectedProcedure`
 * (`enforceAuth`) throws `UNAUTHORIZED` as usual.
 */
export async function createTRPCContext(
  opts: FetchCreateContextFnOptions,
): Promise<TRPCContext> {
  const authHeader = opts.req.headers.get("authorization") ?? "";

  if (authHeader.startsWith("Bearer ")) {
    const mobileSession = await resolveMobileTRPCContext(authHeader);
    if (mobileSession) {
      return {
        ...mobileSession,
        db: prisma,
        req: opts.req,
      };
    }
    return {
      session: null,
      userId: null,
      role: null,
      tenantId: null,
      tenantSlug: null,
      db: prisma,
      req: opts.req,
    };
  }

  const session = await auth();

  return {
    session,
    userId: session?.user.id ?? null,
    role: session?.user.role ?? null,
    tenantId: session?.user.tenantId ?? null,
    tenantSlug: session?.user.tenantSlug ?? null,
    db: prisma,
    req: opts.req,
  };
}
