/**
 * resolveActorPlatformMatrix() — DB-backed PlatformActor resolver for
 * `hasPlatformPermission()`. Milestone 2 of the Site Access & Tenancy
 * Bootstrap Standard (docs/SITE_ACCESS_STANDARD.md §2).
 *
 * Bridges the pure `@frms/shared/rbac` platform resolver to the real DB:
 * given a tRPC ctx (post-`enforceAuth`, so `ctx.role`/`ctx.userId` are
 * populated by the SESSION — never trust a client-sent value), determines
 * whether the calling `tenant_manager` has an assigned scope='platform'
 * `CustomRole` (`User.customRoleId`) and, if so, loads its
 * `PlatformRolePermission` rows into a `PlatformPermissionMatrix`.
 *
 * CODE-DISJOINT FROM `resolveActorMatrix()` (../rbac/resolve.ts) BY DESIGN —
 * this module NEVER touches `RolePermission` (the tenant-domain table) and
 * `resolveActorMatrix()` NEVER touches `PlatformRolePermission`. The two
 * paths share no function.
 *
 * SECURITY CONTRACT
 *   - Deny-by-default: any DB miss (no user row, no customRoleId, an
 *     inactive platform role, or — defense-in-depth — a customRoleId that
 *     resolves to a `scope !== "platform"` role, which should be
 *     structurally unreachable given the assignment guard in
 *     `platformRole.ts`) falls back to a FAIL-CLOSED empty matrix
 *     (`{ role, matrix: {} }`), NEVER to the ADMIN ceiling. Only a
 *     genuinely absent `customRoleId` resolves to the ADMIN ceiling
 *     (`{ role }`, no matrix) — that is the deliberate "no platform custom
 *     role = ADMIN" default from the Platform Actor Model, not a fallback
 *     from a corrupted/mismatched assignment.
 *   - `role` MUST already be server-resolved (this module trusts `ctx.role`
 *     exactly as far as `enforceAuth` in `../trpc/trpc.ts` does — it does
 *     not re-verify the session).
 *   - `actor.role !== "tenant_manager"` short-circuits WITHOUT a DB lookup —
 *     `hasPlatformPermission()` already denies everything for a non-platform
 *     actor, so there is nothing useful to resolve.
 *   - Uses `platformPrisma` (the UNGUARDED client) — a `tenant_manager`
 *     caller has `ctx.tenantId = null` / no `runWithTenant()` ALS context,
 *     so the tenant-guarded `ctx.db` would throw for this lookup. Every
 *     query below is scoped by `role: "tenant_manager"` / `scope:
 *     "platform"` explicitly, never by an unscoped id lookup alone.
 *
 * MEMOIZATION — identical request-scoped WeakMap-on-`ctx.req` pattern as
 * `resolveActorMatrix()`; see that module's doc comment for the full
 * rationale (one DB round trip per HTTP request, not per procedure call).
 */
import { TRPCError } from "@trpc/server";

import { platformPrisma } from "@frms/db";
import type { PlatformPermissionMatrix } from "@frms/shared/rbac";
import type { UserRole } from "@frms/shared/types";

import type { TRPCContext } from "../trpc/context";

export interface ResolvedPlatformActor {
  role: UserRole;
  matrix?: PlatformPermissionMatrix;
}

/** Minimal ctx shape this module needs — narrower than the full TRPCContext. */
export type ResolvePlatformMatrixCtx = Pick<TRPCContext, "role" | "userId" | "req">;

// Request-scoped memoization — separate cache from resolve.ts's, keyed on
// the same `ctx.req` but never shared (different WeakMap instance), so a
// platform lookup and a tenant lookup within the same request never collide.
const requestCache = new WeakMap<Request, Promise<ResolvedPlatformActor>>();

export async function resolveActorPlatformMatrix(
  ctx: ResolvePlatformMatrixCtx,
): Promise<ResolvedPlatformActor> {
  if (!ctx.role || !ctx.userId) {
    // Should be unreachable behind protectedProcedure's enforceAuth, but
    // fail closed (deny-by-default) rather than assert-cast a null role.
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (ctx.role !== "tenant_manager") {
    // Not a platform actor — hasPlatformPermission() denies everything for
    // this role regardless of `matrix`, so skip the DB round trip.
    return { role: ctx.role };
  }

  const cached = requestCache.get(ctx.req);
  if (cached) return cached;

  const promise = computePlatformActorMatrix(ctx);
  requestCache.set(ctx.req, promise);
  return promise;
}

async function computePlatformActorMatrix(
  ctx: ResolvePlatformMatrixCtx,
): Promise<ResolvedPlatformActor> {
  const role = ctx.role as UserRole; // "tenant_manager" — checked by the caller.
  const userId = ctx.userId as string;

  const user = await platformPrisma.user.findFirst({
    where: { id: userId, role: "tenant_manager" },
    select: {
      customRoleId: true,
      customRole: { select: { isActive: true, scope: true } },
    },
  });

  if (!user?.customRoleId) {
    // No platform custom role assigned — the deliberate ADMIN default.
    return { role };
  }

  // Defense-in-depth against a data-integrity bug (a customRoleId that
  // points at a scope='tenant' role, which the assignment guard in
  // platformRole.ts should make unreachable): fail CLOSED, never grant the
  // ADMIN ceiling on a mismatched/corrupted assignment.
  if (user.customRole?.scope !== "platform") {
    return { role, matrix: {} };
  }

  // A DEACTIVATED platform role denies everything (fail closed), same
  // reasoning as resolveActorMatrix()'s tenant-scope equivalent.
  if (user.customRole.isActive === false) {
    return { role, matrix: {} };
  }

  const rows = await platformPrisma.platformRolePermission.findMany({
    where: { roleId: user.customRoleId },
    select: { permissionKey: true, view: true, write: true, update: true, delete: true },
  });

  if (rows.length === 0) {
    // A platform role with zero grant rows persisted — deny-by-default;
    // do NOT fall back to the ADMIN ceiling.
    return { role, matrix: {} };
  }

  const matrix: PlatformPermissionMatrix = {};
  for (const row of rows) {
    matrix[row.permissionKey] = {
      view: row.view,
      write: row.write,
      update: row.update,
      delete: row.delete,
    };
  }

  return { role, matrix };
}
