import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { runWithTenant } from "@frms/db";
import {
  hasPermission,
  hasPlatformPermission,
  type FeatureKey,
  type PermissionAction,
  type PlatformPermissionKey,
} from "@frms/shared/rbac";
import type { UserRole } from "@frms/shared/types";

import { rateLimiters } from "../lib/rate-limit";
import { resolveActorMatrix } from "../rbac/resolve";
import { resolveActorPlatformMatrix } from "../rbac/resolve-platform";
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

/**
 * platformMatrixProcedure(key, action) — Milestone 2 platform-tier
 * counterpart to `matrixProcedure`. CODE-DISJOINT from it by design: this
 * resolves ONLY `PlatformPermissionKey` grants via
 * `resolveActorPlatformMatrix()` / `hasPlatformPermission()`, never the
 * tenant-domain `FeatureKey` path.
 *
 * Requires `role === "tenant_manager"` (the only role that can ever be a
 * platform actor — see docs/SITE_ACCESS_STANDARD.md §2) BEFORE resolving the
 * matrix, so a non-platform caller is rejected with FORBIDDEN without a DB
 * round trip. Then denies with FORBIDDEN unless `hasPlatformPermission()`
 * grants `action` on `key`. Deny-by-default throughout.
 *
 * Use this instead of `tenantManagerProcedure` on any platform (`/tm`)
 * router whose authorization should follow the platform BILLING/TECH
 * SUPPORT curated-role matrix rather than an unconditional
 * tenant_manager-always-wins check.
 */
export const platformMatrixProcedure = (
  key: PlatformPermissionKey,
  action: PermissionAction,
) =>
  protectedProcedure
    .use(requireRole("tenant_manager"))
    .use(async ({ ctx, next }) => {
      const actor = await resolveActorPlatformMatrix(ctx);
      if (!hasPlatformPermission(actor, key, action)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return next({ ctx });
    });

/**
 * platformOrTenantAdminProcedure(key, action) — dual-purpose guard for
 * routers that serve BOTH a `tenant_superadmin` managing their OWN tenant
 * (legit self-service) AND a platform `tenant_manager` doing cross-tenant
 * break-glass management (e.g. tenantUser.ts). Security-fix follow-up to
 * the M2 platform-management gap: `tenantSuperadminProcedure` alone admits
 * `tenant_manager` unconditionally, which let a curated BILLING/TECH SUPPORT
 * platform account (no `tenant_management` grant) manage arbitrary tenants'
 * users. Single reusable implementation — do not duplicate this branch per
 * router/procedure.
 *
 * Dispatch:
 *   - `role === "tenant_manager"` — MUST hold `hasPlatformPermission(actor,
 *     key, action)` via `resolveActorPlatformMatrix()` (ADMIN ceiling passes,
 *     a curated role without the `tenant_management` grant is FORBIDDEN).
 *   - `role === "tenant_superadmin"` — passes unconditionally, preserving
 *     existing self-service behavior; the router's own input/ctx checks
 *     (e.g. scoping by the input `tenantId`) still apply downstream.
 *   - any other role — FORBIDDEN (mirrors `tenantSuperadminProcedure`'s
 *     `requireRole("tenant_manager", "tenant_superadmin")`).
 */
export const platformOrTenantAdminProcedure = (
  key: PlatformPermissionKey,
  action: PermissionAction,
) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    if (ctx.role === "tenant_manager") {
      const actor = await resolveActorPlatformMatrix(ctx);
      if (!hasPlatformPermission(actor, key, action)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return next({ ctx });
    }
    if (ctx.role === "tenant_superadmin") {
      return next({ ctx });
    }
    throw new TRPCError({ code: "FORBIDDEN" });
  });
