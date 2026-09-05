/**
 * authorizeCredentials() — the ONE credential-verify path for username +
 * password, shared by BOTH the web Auth.js Credentials provider
 * (`./index.ts`) and the mobile bearer-token login (`../trpc/routers/
 * mobileAuth.ts`, FIS-37). Extracted so web and mobile never fork the
 * bcrypt/status/tenant/securityVersion verification logic.
 *
 * SECURITY CONTRACT
 *   - Fail-CLOSED + generic (returns `null`, never throws a
 *     detail-bearing error) on: unknown username, wrong password, inactive
 *     user, tenant-slug mismatch, suspended tenant. The caller (Auth.js
 *     `authorize()` / the `mobileAuth.login` procedure) is responsible for
 *     turning a `null` into a GENERIC "invalid credentials" response — never
 *     surface *why* it failed (no user-enumeration).
 *   - bcrypt compare is constant-time via `bcryptjs` (existing dependency —
 *     unchanged from the pre-extraction `authorize()`).
 *   - `tenantId`/`tenantSlug`/`role`/`securityVersion` in the returned shape
 *     come ONLY from the DB row just looked up — never from caller input
 *     beyond the `username`/`password`/optional `tenantSlug` filter.
 */
import bcrypt from "bcryptjs";

import { platformPrisma } from "@frms/db";
import type { UserRole } from "@frms/shared/types";
import type { FeatureKey } from "@frms/shared/rbac";

import { loadCustomRoleView } from "../rbac/mint";

/** The 3 fixed system tiers — mirrors resolve.ts FIXED_TIER_ROLES. Never
 * carry a `customRoleId`, so `loadCustomRoleView` is never called for them. */
const FIXED_TIER_ROLES: ReadonlySet<UserRole> = new Set([
  "tenant_manager",
  "tenant_superadmin",
  "tenant_admin",
]);

export type AuthorizedUser = {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
  securityVersion: number;
  customView?: FeatureKey[] | null | undefined;
};

export type AuthorizeCredentialsInput = {
  username: string;
  password: string;
  /** Optional tenant-scoping filter — a non-`tenant_manager` user whose
   * tenant slug doesn't match this is refused (same as the web provider). */
  tenantSlug?: string | undefined;
};

/**
 * Verifies a username/password pair against the platform DB and returns the
 * authenticated user's public shape, or `null` on ANY failure (never
 * distinguishes the reason to the caller — that is the anti-enumeration
 * contract).
 */
export async function authorizeCredentials({
  username,
  password,
  tenantSlug,
}: AuthorizeCredentialsInput): Promise<AuthorizedUser | null> {
  const user = await platformPrisma.user.findFirst({
    where: { username, status: "ACTIVE" },
    include: { tenant: true },
  });

  if (!user) return null;

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) return null;

  if (user.role !== "tenant_manager") {
    if (!user.tenantId) return null;
    if (tenantSlug && user.tenant?.slug !== tenantSlug) return null;
  }

  if (user.tenant?.status === "SUSPENDED") return null;

  // Mint the custom-role "view" feature set (PD-005 Chunk 4). Fixed
  // tiers never carry a customRoleId — skip the DB round trip and
  // attach nothing (undefined), matching resolve.ts's short-circuit.
  const customView = FIXED_TIER_ROLES.has(user.role)
    ? undefined
    : await loadCustomRoleView(platformPrisma, user.id, user.tenantId ?? "");

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    tenantSlug: user.tenant?.slug ?? null,
    securityVersion: user.securityVersion,
    customView,
  };
}
