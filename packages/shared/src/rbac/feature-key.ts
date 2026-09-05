/**
 * FeatureKey — mirrored union of the Prisma `enum FeatureKey`
 * (packages/db/prisma/schema.prisma). PD-005 Chunk 2.
 *
 * This module is PURE — zero runtime imports from `@frms/db` — because
 * `hasPermission()` (permissions.ts) must be importable from edge
 * middleware, which cannot pull in the generated Prisma client. We mirror
 * the enum's values as a local const array instead of importing the type
 * from `@frms/db`; `feature-key.sync.test.ts` parses the Prisma schema's
 * `enum FeatureKey { ... }` block directly and asserts this array stays in
 * lockstep, so drift between the two is caught by CI rather than silently
 * shipping a stale/mismatched feature list.
 *
 * Deliberately excludes `billing` and `user_management` — those stay
 * exclusive to `tenant_superadmin` / `tenant_manager` and are never
 * gateable via the custom-role matrix. See
 * ~/.claude/rules/tenant-rbac-standard.md §4 Guardrails.
 */
export const FEATURE_KEYS = [
  "fisherfolk",
  "households",
  "vessels",
  "fish_catches",
  "violations",
  "ayuda",
  "edit_requests",
  "kanban",
  "reports",
  "analytics",
  "map",
  "notifications",
  "id_generator",
  "import",
  "audit_log",
  "data_management",
  "notes",
  "projects",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];
