/**
 * SEGMENT_FEATURE_MAP + canAccessRouteSegment — PD-005 Chunk 4, Task A.
 *
 * Pure, edge-safe route-segment → FeatureKey mapping and access guard. This
 * is surface #2 of the 3-surface enforcement pattern (tRPC procedures are
 * surface #1 via `matrixProcedure`/`trpc.ts`, sidebar nav is surface #3 via
 * `canSeeNavItem` — see ~/.claude/rules/tenant-rbac-standard.md §4). It maps
 * a tenant-scoped URL's feature segment (`/${slug}/${segment}/...`) to a
 * `FeatureKey` and resolves view access through the shared `hasPermission()`
 * matrix resolver, so route-level (middleware) enforcement stays in lockstep
 * with the tRPC and nav-filter surfaces.
 *
 * PURE — zero runtime imports beyond `@frms/shared/rbac`. No Prisma, no
 * next-auth, no Node builtins — safe to import from Next.js edge
 * middleware. Wiring this into middleware.ts is a LATER Chunk 4 task; this
 * module only provides the map + the guard function.
 *
 * `dashboard`, `settings`, `user-management`, and `data-management` are
 * DELIBERATELY UNMAPPED — they are not FeatureKey-gateable (billing/
 * user_management can never be matrix-gated, per the RBAC standard's
 * Guardrails) and simply pass through `canAccessRouteSegment`.
 */
import { hasPermission, type Actor, type FeatureKey } from "@frms/shared/rbac";

export const SEGMENT_FEATURE_MAP: Readonly<Record<string, FeatureKey>> = {
  analytics: "analytics",
  "audit-log": "audit_log",
  ayuda: "ayuda",
  "edit-requests": "edit_requests",
  "fish-catches": "fish_catches",
  fisherfolk: "fisherfolk",
  households: "households",
  "id-generator": "id_generator",
  import: "import",
  kanban: "kanban",
  todo: "kanban",
  map: "map",
  notifications: "notifications",
  reports: "reports",
  vessels: "vessels",
  violations: "violations",
  // FIS-13 — QR verify reuses the `fisherfolk` feature: verifyByQr is
  // gated matrixProcedure("fisherfolk", "view"), same as the fisherfolk
  // list/detail pages.
  verify: "fisherfolk",
};

/**
 * Resolve whether `actor` may VIEW the feature gated by `pathname`'s
 * segment. URL shape is `/${slug}/${segment}/...` — `pathname.split("/")`
 * yields `["", slug, segment, ...]`, so the feature segment is index 2.
 *
 * Returns `true` (pass through, no gate) when the segment is missing or is
 * not a key in `SEGMENT_FEATURE_MAP` — those routes are not
 * FeatureKey-gateable and are left to their own access control.
 */
export function canAccessRouteSegment(actor: Actor, pathname: string): boolean {
  const segment = pathname.split("/")[2];

  if (!segment || !(segment in SEGMENT_FEATURE_MAP)) {
    return true;
  }

  return hasPermission(actor, SEGMENT_FEATURE_MAP[segment]!, "view");
}
