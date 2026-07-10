/**
 * hasPermission() — PURE authorization resolver. PD-005 Chunk 2.
 *
 * Zero runtime imports from `@frms/db` or any I/O — this module must be
 * safe to import from edge middleware, tRPC procedures, and sidebar-nav
 * filtering alike (the 3-surface enforcement pattern in
 * ~/.claude/rules/tenant-rbac-standard.md §4). Only local, side-effect-free
 * types/values are imported.
 *
 * SECURITY CONTRACT (read before wiring this into a router/middleware):
 *   - Deny-by-default. Any FeatureKey/action combination with no explicit
 *     `true` grant resolves to `false`.
 *   - The caller MUST pass an `Actor` resolved SERVER-SIDE from the
 *     authenticated session/DB (role + matrix). NEVER construct an Actor
 *     from a client-sent role/matrix string — that is a trivial privilege
 *     escalation (a forged JWT claim or request body granting itself
 *     tenant_admin). This module does not — and cannot — verify where its
 *     input came from; that responsibility belongs to the caller.
 *   - Custom roles (the `matrix` field) can NEVER exceed the
 *     `tenant_admin` ceiling and can NEVER grant billing/user_management —
 *     those are not valid FeatureKey values, so this is enforced at the
 *     type level, not just at runtime. See `intersectWithCeiling`.
 */
import type { UserRole } from "../types/enums";
import { FEATURE_KEYS, type FeatureKey } from "./feature-key";

export type PermissionAction = "view" | "write" | "update" | "delete";

/** STRICT-CRUD split: `write` = create-only, `update` = edit-only. */
export type FeaturePermissions = Record<PermissionAction, boolean>;

/** Sparse — a feature absent from the matrix denies every action on it. */
export type PermissionMatrix = Partial<Record<FeatureKey, FeaturePermissions>>;

/**
 * A server-resolved actor. `role` MUST come from the authenticated
 * session/DB — never trust a client-sent role. `matrix` is present only
 * for a custom-role actor (assigned a `CustomRole` — see
 * packages/db/prisma/schema.prisma `model CustomRole`); when present it
 * takes over resolution entirely (deny-by-default), superseding whatever
 * domain-role preset `role` would otherwise imply.
 */
export interface Actor {
  role: UserRole;
  matrix?: PermissionMatrix;
}

const FULL_FEATURE_PERMISSIONS: FeaturePermissions = {
  view: true,
  write: true,
  update: true,
  delete: true,
};

const VIEW_ONLY_FEATURE_PERMISSIONS: FeaturePermissions = {
  view: true,
  write: false,
  update: false,
  delete: false,
};

const WRITE_UPDATE_NO_DELETE_FEATURE_PERMISSIONS: FeaturePermissions = {
  view: true,
  write: true,
  update: true,
  delete: false,
};

function fullMatrix(): Required<PermissionMatrix> {
  const matrix = {} as Record<FeatureKey, FeaturePermissions>;
  for (const key of FEATURE_KEYS) {
    matrix[key] = FULL_FEATURE_PERMISSIONS;
  }
  return matrix;
}

/**
 * The `tenant_admin` capability ceiling: every FeatureKey, every action,
 * true. `billing` and `user_management` are not valid FeatureKey values
 * (see feature-key.ts), so they are structurally unreachable here —
 * tenant_admin can never be granted them by construction.
 */
export const TENANT_ADMIN_CEILING: Required<PermissionMatrix> = fullMatrix();

function buildPreset(
  grants: Partial<Record<FeatureKey, FeaturePermissions>>,
): PermissionMatrix {
  return grants;
}

/**
 * Fixed capability templates for the app's domain roles (below the 3
 * top system tiers — see tenant-rbac-standard.md §3 "Sub-role PRESETS").
 * Each mapping is a deliberate design choice for FRMS, documented inline;
 * mirrored/asserted in permissions.test.ts.
 */
export const DOMAIN_ROLE_PRESETS: Record<
  "encoder" | "viewer" | "bantay_dagat",
  PermissionMatrix
> = {
  /**
   * viewer — Viewer preset: read-only across every feature. No write /
   * update / delete anywhere.
   */
  viewer: buildPreset(
    Object.fromEntries(
      FEATURE_KEYS.map((key) => [key, VIEW_ONLY_FEATURE_PERMISSIONS]),
    ),
  ),

  /**
   * encoder — Operator preset: write+update (create/edit, no delete) on
   * the operational data-entry features encoders own; NOT granted on
   * anything else (no fallback view elsewhere in this mapping). Mirrors
   * apps/web/src/components/nav-items.ts, where `encoder` is present for
   * Fisherfolk / Household / Vessels / Fish Catches / Edit Requests /
   * ToDo(kanban) / ID Generator / Notifications, and absent from
   * Violations / Ayuda / Analytics / Map / Reports / Data Import /
   * Audit Log.
   */
  encoder: buildPreset({
    fisherfolk: WRITE_UPDATE_NO_DELETE_FEATURE_PERMISSIONS,
    households: WRITE_UPDATE_NO_DELETE_FEATURE_PERMISSIONS,
    vessels: WRITE_UPDATE_NO_DELETE_FEATURE_PERMISSIONS,
    fish_catches: WRITE_UPDATE_NO_DELETE_FEATURE_PERMISSIONS,
    edit_requests: WRITE_UPDATE_NO_DELETE_FEATURE_PERMISSIONS,
    kanban: WRITE_UPDATE_NO_DELETE_FEATURE_PERMISSIONS,
    id_generator: WRITE_UPDATE_NO_DELETE_FEATURE_PERMISSIONS,
    notifications: WRITE_UPDATE_NO_DELETE_FEATURE_PERMISSIONS,
  }),

  /**
   * bantay_dagat — fisheries-enforcement operational shape (a Supervisor-
   * flavored preset scoped to the enforcement duty): write+update on
   * violations (filing/lifting is their core job), view-only on
   * fisherfolk/vessels/fish_catches (identification during enforcement
   * stops), nothing else. NOTE: today's legacy tRPC procedures
   * (apps/web/src/server/trpc/routers/violation.ts) still gate
   * create/update/lift behind `adminProcedure` only — this preset is the
   * forward-looking matrix-driven shape for when those routers are
   * migrated onto `hasPermission()` (a later PD-005 chunk); it does not
   * retroactively change today's procedure-level checks.
   */
  bantay_dagat: buildPreset({
    violations: WRITE_UPDATE_NO_DELETE_FEATURE_PERMISSIONS,
    fisherfolk: VIEW_ONLY_FEATURE_PERMISSIONS,
    vessels: VIEW_ONLY_FEATURE_PERMISSIONS,
    fish_catches: VIEW_ONLY_FEATURE_PERMISSIONS,
  }),
};

/**
 * Clamp a custom-role's grants to the `tenant_admin` ceiling and drop any
 * key that is not a valid FeatureKey. Total over FeatureKey (only keys
 * present in `grants` survive) and idempotent — since the ceiling is
 * all-true for every real FeatureKey, ANDing twice is a no-op beyond the
 * first pass's key-filtering.
 */
export function intersectWithCeiling(
  grants: PermissionMatrix,
): PermissionMatrix {
  const result: PermissionMatrix = {};
  for (const key of FEATURE_KEYS) {
    const grant = grants[key];
    if (!grant) continue;
    const ceiling = TENANT_ADMIN_CEILING[key];
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
 * Resolve whether `actor` may perform `action` on `feature`.
 *
 * Dispatch order:
 *   1. `tenant_manager` / `tenant_superadmin` — platform/tenant-owner
 *      ceiling, always true (cross-tenant scoping for `tenant_manager` is
 *      out of scope for this pure resolver — enforced separately by
 *      tenant context, see runWithTenant / platformPrisma).
 *   2. `tenant_admin` — the fixed ceiling, always true.
 *   3. `actor.matrix` present — a custom-role actor. Matrix-driven,
 *      deny-by-default, clamped to the tenant_admin ceiling. Presence of
 *      a matrix supersedes any domain-role preset `actor.role` would
 *      otherwise imply.
 *   4. Fixed domain-role preset lookup (encoder / viewer / bantay_dagat).
 *   5. Anything else — deny.
 *
 * NEVER trust a client-sent Actor — see the module-level SECURITY
 * CONTRACT comment above.
 */
export function hasPermission(
  actor: Actor,
  feature: FeatureKey,
  action: PermissionAction,
): boolean {
  if (
    actor.role === "tenant_manager" ||
    actor.role === "tenant_superadmin" ||
    actor.role === "tenant_admin"
  ) {
    return true;
  }

  if (actor.matrix) {
    const clamped = intersectWithCeiling(actor.matrix);
    return clamped[feature]?.[action] ?? false;
  }

  const preset =
    actor.role === "encoder" || actor.role === "viewer" || actor.role === "bantay_dagat"
      ? DOMAIN_ROLE_PRESETS[actor.role]
      : undefined;

  return preset?.[feature]?.[action] ?? false;
}
