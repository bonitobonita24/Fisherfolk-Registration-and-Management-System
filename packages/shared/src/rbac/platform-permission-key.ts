/**
 * PlatformPermissionKey — mirrored union of the Prisma `enum
 * PlatformPermissionKey` (packages/db/prisma/schema.prisma). Milestone 2 of
 * the Site Access & Tenancy Bootstrap Standard (docs/SITE_ACCESS_STANDARD.md
 * §2).
 *
 * PURE — zero runtime imports from `@frms/db` — mirrors the `feature-key.ts`
 * pattern so `hasPlatformPermission()` stays importable from edge
 * middleware. This vocabulary is PHYSICALLY SEPARATE from `FeatureKey`: a
 * platform custom role (scope='platform') can only ever be granted these
 * four keys, never a tenant-domain FeatureKey, and vice-versa — the
 * anti-escalation guardrail is enforced structurally, not just at runtime.
 */
export const PLATFORM_PERMISSION_KEYS = [
  "billing",
  "tenant_management",
  "data_overrides",
  "tech_support",
] as const;

export type PlatformPermissionKey = (typeof PLATFORM_PERMISSION_KEYS)[number];
