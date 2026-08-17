/**
 * platform-access.ts — SERVER-COMPONENT platform-permission resolver.
 *
 * The `/tm` layout + pages are React Server Components; they authenticate via
 * `auth()` (a NextAuth session), not a tRPC `ctx`, so they cannot use the
 * WeakMap-memoized `resolveActorPlatformMatrix()` (which keys its cache on
 * `ctx.req`). This module bridges the same fail-closed DB loader
 * (`loadPlatformActorMatrix`) to that world and dedupes the single DB round
 * trip across the layout + page render of one request via React `cache()`.
 *
 * Milestone follow-up to the Site Access & Tenancy Bootstrap Standard
 * (docs/SITE_ACCESS_STANDARD.md §2): closes the UX gap where a restricted
 * platform account (a `tenant_manager` carrying a BILLING/TECH platform
 * custom role, i.e. NO `tenant_management` grant) was hard-landed on
 * `/tm/tenants` — a page it is forbidden from — producing a 403 + retry loop.
 * The `/tm` landing now consults this resolver instead of the bare enum role.
 *
 * Same SECURITY CONTRACT as `resolve-platform.ts`: pass a role that was
 * server-resolved from the session; never a client-sent value.
 */
import "server-only";

import { cache } from "react";

import {
  hasPlatformPermission,
  type PermissionAction,
  type PlatformPermissionKey,
} from "@frms/shared/rbac";

import {
  loadPlatformActorMatrix,
  type ResolvedPlatformActor,
} from "./resolve-platform";

/**
 * Resolve the platform actor for an authenticated session user id.
 * `cache()`-wrapped so the layout guard and the page landing check share one
 * DB round trip per request. Callers must already have confirmed the session
 * role is `tenant_manager` (the `/tm` layout does); the loader itself is
 * fail-closed for any other role regardless.
 */
export const resolvePlatformActorForSession = cache(
  async (userId: string): Promise<ResolvedPlatformActor> =>
    loadPlatformActorMatrix("tenant_manager", userId),
);

/**
 * Convenience: does this session user hold `action` on the platform `key`?
 * Deny-by-default via `hasPlatformPermission()`.
 */
export async function sessionHasPlatformPermission(
  userId: string,
  key: PlatformPermissionKey,
  action: PermissionAction,
): Promise<boolean> {
  const actor = await resolvePlatformActorForSession(userId);
  return hasPlatformPermission(actor, key, action);
}

/**
 * Human-readable label for a platform account's tier, for UI display only
 * (e.g. the `/tm` header badge) — NEVER an authorization input. A restricted
 * account shows its assigned platform CustomRole name ("BILLING",
 * "TECH SUPPORT"); the un-matrixed platform manager (full ceiling) shows
 * "Admin". Shares the `cache()`d actor, so it adds no DB round trip.
 */
export async function resolvePlatformRoleLabel(userId: string): Promise<string> {
  const actor = await resolvePlatformActorForSession(userId);
  return actor.customRoleName ?? "Admin";
}
