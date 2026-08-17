/**
 * hasPlatformPermission() — PURE authorization resolver for the /tm platform
 * tier. Milestone 2 of the Site Access & Tenancy Bootstrap Standard
 * (docs/SITE_ACCESS_STANDARD.md §2).
 *
 * CODE-DISJOINT FROM `hasPermission()` (./permissions.ts) BY DESIGN — this is
 * the anti-escalation guardrail. `hasPermission()` resolves tenant-domain
 * `FeatureKey` grants; this module resolves platform `PlatformPermissionKey`
 * grants. No shared function resolves both, and the two matrix types
 * (`PermissionMatrix` / `PlatformPermissionMatrix`) are structurally
 * incompatible key-sets, so a platform matrix can never be passed where a
 * tenant matrix is expected or vice-versa.
 *
 * PLATFORM ACTOR MODEL (docs/SITE_ACCESS_STANDARD.md §2):
 *   - A platform user always has enum `role = "tenant_manager"`. Any other
 *     role is NOT a platform actor — `hasPlatformPermission()` returns
 *     `false` for every key/action regardless of whatever `matrix` might be
 *     attached (defense-in-depth; the resolver should never even attach one).
 *   - `tenant_manager` with NO platform custom role (`matrix` undefined) =
 *     ADMIN = the full platform ceiling (every key, every action).
 *   - `tenant_manager` WITH an assigned scope='platform' custom role =
 *     RESTRICTED to that role's `PlatformRolePermission` matrix,
 *     deny-by-default.
 *
 * SECURITY CONTRACT — identical shape to `hasPermission()`'s: the caller
 * MUST pass a `PlatformActor` resolved SERVER-SIDE (see
 * `apps/web/src/server/rbac/resolve-platform.ts`). Never construct one from
 * a client-sent role/matrix.
 */
import type { UserRole } from "../types/enums";
import type { FeaturePermissions, PermissionAction } from "./permissions";
import {
  PLATFORM_PERMISSION_KEYS,
  type PlatformPermissionKey,
} from "./platform-permission-key";

/** Sparse — a key absent from the matrix denies every action on it. */
export type PlatformPermissionMatrix = Partial<
  Record<PlatformPermissionKey, FeaturePermissions>
>;

/**
 * A server-resolved platform actor. `role` MUST come from the authenticated
 * session/DB. `matrix` is present only when the `tenant_manager` caller has
 * an assigned scope='platform' `CustomRole`; when present it supersedes the
 * ADMIN default entirely (deny-by-default).
 */
export interface PlatformActor {
  role: UserRole;
  matrix?: PlatformPermissionMatrix;
}

const FULL_PLATFORM_PERMISSIONS: FeaturePermissions = {
  view: true,
  write: true,
  update: true,
  delete: true,
};

function fullPlatformMatrix(): Required<PlatformPermissionMatrix> {
  const matrix = {} as Record<PlatformPermissionKey, FeaturePermissions>;
  for (const key of PLATFORM_PERMISSION_KEYS) {
    matrix[key] = FULL_PLATFORM_PERMISSIONS;
  }
  return matrix;
}

/**
 * The ADMIN ceiling: every PlatformPermissionKey, every action, true. This
 * is what an un-matrixed `tenant_manager` (no platform custom role) resolves
 * to, and it is also the clamp ceiling for any platform custom role — a
 * platform role can never exceed ADMIN.
 */
export const PLATFORM_ADMIN_CEILING: Required<PlatformPermissionMatrix> =
  fullPlatformMatrix();

/**
 * Clamp a platform custom-role's grants to the ADMIN ceiling and drop any
 * key that is not a valid PlatformPermissionKey. Mirrors
 * `intersectWithCeiling()` in ./permissions.ts. Since the ceiling is
 * all-true for every real PlatformPermissionKey, this is mainly a
 * defense-in-depth key-filter today, but keeps the clamp semantics
 * consistent and future-proof if the ceiling is ever narrowed.
 */
export function intersectWithPlatformCeiling(
  grants: PlatformPermissionMatrix,
): PlatformPermissionMatrix {
  const result: PlatformPermissionMatrix = {};
  for (const key of PLATFORM_PERMISSION_KEYS) {
    const grant = grants[key];
    if (!grant) continue;
    const ceiling = PLATFORM_ADMIN_CEILING[key];
    result[key] = {
      view: grant.view && ceiling.view,
      write: grant.write && ceiling.write,
      update: grant.update && ceiling.update,
      delete: grant.delete && ceiling.delete,
    };
  }
  return result;
}

/**
 * Resolve whether `actor` may perform `action` on the platform `key`.
 *
 * Dispatch order:
 *   1. `actor.role !== "tenant_manager"` — not a platform actor at all,
 *      always deny. (A tenant-scoped user, however privileged within its
 *      own tenant, has no platform standing.)
 *   2. `actor.matrix` absent — ADMIN ceiling, always true.
 *   3. `actor.matrix` present — matrix-driven, deny-by-default, clamped to
 *      the ADMIN ceiling.
 *
 * NEVER trust a client-sent PlatformActor — see the module-level SECURITY
 * CONTRACT comment above.
 */
export function hasPlatformPermission(
  actor: PlatformActor,
  key: PlatformPermissionKey,
  action: PermissionAction,
): boolean {
  if (actor.role !== "tenant_manager") {
    return false;
  }

  if (!actor.matrix) {
    return true;
  }

  const clamped = intersectWithPlatformCeiling(actor.matrix);
  return clamped[key]?.[action] ?? false;
}
