import { NextResponse } from "next/server";

import { auth } from "@/server/auth";

/**
 * Route Handler authentication context — the App-Router equivalent of the
 * tRPC `TRPCContext` fields needed by API routes that bypass tRPC middleware
 * (security.md L11) and therefore MUST call `requireRouteAuth()` themselves
 * before touching any tenant-scoped data.
 */
export interface RouteAuthContext {
  userId: string;
  tenantId: string;
  role: string;
}

/**
 * Thrown by `requireRouteAuth()` when no valid, tenant-scoped session is
 * present. Carries a ready-to-return 401 `NextResponse` so callers can do:
 *
 * ```ts
 * try {
 *   const ctx = await requireRouteAuth();
 * } catch (err) {
 *   if (err instanceof RouteAuthError) return err.response;
 *   throw err;
 * }
 * ```
 */
export class RouteAuthError extends Error {
  readonly response: NextResponse;

  constructor(response: NextResponse = RouteAuthError.unauthorizedResponse()) {
    super("Route handler authentication failed");
    this.name = "RouteAuthError";
    this.response = response;
  }

  private static unauthorizedResponse(): NextResponse {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * Verify the current request has a valid authenticated session with tenant
 * context, and return the minimal identity fields FRMS Route Handlers need.
 *
 * Route Handlers bypass tRPC middleware (security.md L11) so they MUST call
 * this before reading/writing any tenant-scoped resource.
 */
export async function requireRouteAuth(): Promise<RouteAuthContext> {
  const session = await auth();

  if (session === null) {
    throw new RouteAuthError();
  }

  const { id: userId, tenantId, role } = session.user;

  if (userId === "" || userId === undefined || tenantId === null || tenantId === "") {
    throw new RouteAuthError();
  }

  return { userId, tenantId, role };
}
