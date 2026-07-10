import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { runWithTenant } from "@frms/db";
import { hasPermission, type FeatureKey, type PermissionAction } from "@frms/shared/rbac";
import type { UserRole } from "@frms/shared/types";

import { rateLimiters } from "../lib/rate-limit";
import { resolveActorMatrix } from "../rbac/resolve";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;
  if (process.env.NODE_ENV === "development") {
    console.log(`[tRPC] ${path} — ${durationMs}ms`);
  }
  return result;
});

export const publicProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    const ip =
      ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    rateLimiters.public.check(ip);
    return next({ ctx });
  });

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: ctx.userId,
      role: ctx.role!,
      tenantId: ctx.tenantId,
    },
  });
});

/**
 * Combined rate-limit + L6 tenant-context wrap. Kept in a single
 * middleware step so the enforceAuth narrowing (userId/session non-null)
 * propagates to downstream router code via tRPC's chained ctx inference.
 * runWithTenant sets the AsyncLocalStorage that the Prisma tenant-guard
 * extension reads; no-op when ctx.tenantId is null (e.g. tenant_manager
 * pre-tenant routes — guarded queries from such a context will still
 * throw, which is correct; those callers should use platformPrisma).
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(enforceAuth)
  .use(async ({ ctx, next }) => {
    rateLimiters.api.check(ctx.userId);
    if (!ctx.tenantId) return next({ ctx });
    return runWithTenant(ctx.tenantId, () => next({ ctx }));
  });

export const requireRole = (...allowedRoles: UserRole[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.role || !allowedRoles.includes(ctx.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });

export const adminProcedure = protectedProcedure.use(
  requireRole("tenant_manager", "tenant_superadmin", "tenant_admin"),
);

export const encoderProcedure = protectedProcedure.use(
  requireRole(
    "tenant_manager",
    "tenant_superadmin",
    "tenant_admin",
    "encoder",
  ),
);

export const tenantManagerProcedure = protectedProcedure.use(
  requireRole("tenant_manager"),
);

export const tenantSuperadminProcedure = protectedProcedure.use(
  requireRole("tenant_manager", "tenant_superadmin"),
);

/**
 * matrixProcedure(feature, action) — PD-005 Chunk 3 data-driven authorization
 * factory. Built on `protectedProcedure` (inherits session enforcement +
 * `runWithTenant`), resolves the caller's effective `Actor` (fixed tier, or
 * domain-role preset, or an assigned custom-role `PermissionMatrix` — see
 * `../rbac/resolve.ts`), and denies with `FORBIDDEN` unless
 * `hasPermission()` grants `action` on `feature`. Deny-by-default: any
 * resolver miss or missing grant throws, never silently passes through.
 *
 * Use this instead of `adminProcedure`/`encoderProcedure` on any router
 * whose authorization should follow the tenant-rbac-standard matrix
 * (custom roles ≤ tenant_admin ceiling) rather than a fixed role list.
 */
export const matrixProcedure = (feature: FeatureKey, action: PermissionAction) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const actor = await resolveActorMatrix(ctx);
    if (!hasPermission(actor, feature, action)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });
