import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { sessionHasPlatformPermission } from "@/server/rbac/platform-access";

import { PlatformNoAccess } from "./platform-no-access";

/**
 * `/tm` — the canonical post-login platform landing (Site Access & Tenancy
 * Standard UX follow-up, 2026-08-17). Middleware now sends every authenticated
 * `tenant_manager` here (not straight to `/tm/tenants`), because the landing
 * decision needs the platform permission MATRIX, which lives in the DB and is
 * unreachable from edge middleware. This server component resolves it:
 *   - holds `tenant_management.view` (full ADMIN, or a role granted it)
 *       → forward to the tenant console `/tm/tenants`;
 *   - otherwise (a restricted BILLING/TECH account with no reachable section)
 *       → render the neutral no-access panel instead of hard-landing on a
 *         forbidden page that would 403 + retry-loop.
 */
export default async function PlatformIndexPage() {
  const session = await auth();

  // Defense-in-depth — the `/tm` layout already enforces auth + the
  // tenant_manager role and redirects otherwise; repeat the fail-closed check
  // here so a direct render can never fall through.
  if (!session?.user || session.user.role !== "tenant_manager") {
    redirect("/tm/login");
  }

  const canManageTenants = await sessionHasPlatformPermission(
    session.user.id,
    "tenant_management",
    "view",
  );

  if (canManageTenants) {
    redirect("/tm/tenants");
  }

  return <PlatformNoAccess />;
}
