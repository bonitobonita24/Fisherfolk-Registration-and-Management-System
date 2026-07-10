/**
 * resolveActorMatrix() — DB-backed Actor resolver for `hasPermission()`.
 * PD-005 Chunk 3.
 *
 * Bridges the pure `@frms/shared/rbac` resolver (Chunk 2) to the real DB:
 * given a tRPC ctx (post-`enforceAuth`, so `ctx.role`/`ctx.userId` are
 * populated by the SESSION — never trust a client-sent value), determines
 * whether the calling user has an optional data-driven `CustomRole`
 * (`User.customRoleId`, PD-005 Chunk 1) and, if so, loads its
 * `RolePermission` rows into a `PermissionMatrix`.
 *
 * SECURITY CONTRACT
 *   - Deny-by-default: any DB miss (no user row, no customRoleId, no
 *     permission rows, an inactive custom role) falls back to
 *     `{ role: ctx.role }`, letting `hasPermission()`'s fixed-tier/preset
 *     path resolve it — never silently grants access.
 *   - `role` MUST already be server-resolved (this module trusts `ctx.role`
 *     exactly as far as `enforceAuth` in `../trpc/trpc.ts` does — it does
 *     not re-verify the session).
 *   - Fixed system tiers (`tenant_manager` / `tenant_superadmin` /
 *     `tenant_admin`) short-circuit WITHOUT a DB lookup — `hasPermission()`
 *     already grants them everything, and a custom role can never apply to
 *     those tiers (tenant-rbac-standard.md §4 guardrail: custom roles are
 *     always ≤ the `tenant_admin` ceiling, never assigned to it).
 *   - Uses the caller's `ctx.db` (the guarded, tenant-scoped Prisma client
 *     for every non-platform caller — see trpc/context.ts). Domain-role
 *     users (`encoder` / `viewer` / `bantay_dagat`, the only roles that can
 *     carry a `customRoleId`) always have a real `tenantId`, so
 *     `protectedProcedure` has already called `runWithTenant()` and the
 *     guarded client is safe here — this function is NEVER reached for a
 *     null-tenantId (platform `tenant_manager`) caller because that tier
 *     short-circuits above.
 *
 * MEMOIZATION — one DB round trip per HTTP request, not per procedure call.
 * tRPC's fetch/batch adapter invokes `createTRPCContext()` ONCE per HTTP
 * request and reuses the SAME `ctx.req` (Request) object across every
 * batched procedure call in that request, even though each procedure's own
 * middleware chain re-spreads `ctx` into new objects downstream. Keying the
 * cache on `ctx.req` (stable, request-scoped, GC'd with the Request) — not
 * on `ctx` itself, whose identity changes across middleware spreads —
 * dedupes repeated `resolveActorMatrix()` calls within one request.
 */
import { TRPCError } from "@trpc/server";

import type { PermissionMatrix } from "@frms/shared/rbac";
import type { UserRole } from "@frms/shared/types";

import type { TRPCContext } from "../trpc/context";

/** The 3 fixed system tiers — always the full ceiling, never matrix-driven. */
const FIXED_TIER_ROLES: ReadonlySet<UserRole> = new Set([
  "tenant_manager",
  "tenant_superadmin",
  "tenant_admin",
]);

export interface ResolvedActor {
  role: UserRole;
  matrix?: PermissionMatrix;
}

/** Minimal ctx shape this module needs — narrower than the full TRPCContext. */
export type ResolveMatrixCtx = Pick<
  TRPCContext,
  "role" | "userId" | "tenantId" | "db" | "req"
>;

// Request-scoped memoization — see module doc "MEMOIZATION" above.
const requestCache = new WeakMap<Request, Promise<ResolvedActor>>();

export async function resolveActorMatrix(
  ctx: ResolveMatrixCtx,
): Promise<ResolvedActor> {
  if (!ctx.role || !ctx.userId) {
    // Should be unreachable behind protectedProcedure's enforceAuth, but
    // fail closed (deny-by-default) rather than assert-cast a null role.
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const cached = requestCache.get(ctx.req);
  if (cached) return cached;

  const promise = computeActorMatrix(ctx);
  requestCache.set(ctx.req, promise);
  return promise;
}

async function computeActorMatrix(
  ctx: ResolveMatrixCtx,
): Promise<ResolvedActor> {
  const role = ctx.role as UserRole;

  if (FIXED_TIER_ROLES.has(role)) {
    return { role };
  }

  // Domain role (encoder / viewer / bantay_dagat) — the only tiers that may
  // carry an optional custom-role override. Always tenant-scoped.
  if (!ctx.tenantId || !ctx.userId) {
    return { role };
  }
  const userId = ctx.userId;
  const tenantId = ctx.tenantId;

  const user = await ctx.db.user.findFirst({
    where: { id: userId, tenantId },
    select: {
      customRoleId: true,
      customRole: { select: { isActive: true } },
    },
  });

  if (!user?.customRoleId) {
    return { role };
  }

  // A DEACTIVATED custom role denies everything (fail closed) rather than
  // silently falling back to the base domain-role preset — assigning a
  // `customRoleId` is the tenant's explicit choice to move this user onto
  // matrix-driven permissions, so deactivating that role must not grant
  // broader ambient access via the preset.
  if (user.customRole?.isActive === false) {
    return { role, matrix: {} };
  }

  const rows = await ctx.db.rolePermission.findMany({
    where: { roleId: user.customRoleId, tenantId },
    select: { featureKey: true, view: true, write: true, update: true, delete: true },
  });

  if (rows.length === 0) {
    return { role };
  }

  const matrix: PermissionMatrix = {};
  for (const row of rows) {
    matrix[row.featureKey] = {
      view: row.view,
      write: row.write,
      update: row.update,
      delete: row.delete,
    };
  }

  return { role, matrix };
}
