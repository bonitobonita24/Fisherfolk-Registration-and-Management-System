import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { sessionHasPlatformPermission } from "@/server/rbac/platform-access";

import { PlatformNoAccess } from "../platform-no-access";
import { TenantsClient } from "./tenants-client";

export default async function TenantsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "tenant_manager") {
    redirect("/tm/login");
  }

  // A restricted BILLING/TECH platform account lacks `tenant_management` and
  // must never reach `TenantsClient` — its `tenant.list` query would 403 and
  // retry-loop. Show the neutral no-access panel instead (also closes the
  // direct-URL / stale callbackUrl path that bypasses the `/tm` resolver).
  if (
    !(await sessionHasPlatformPermission(
      session.user.id,
      "tenant_management",
      "view",
    ))
  ) {
    return <PlatformNoAccess />;
  }

  return (
    <div className="space-y-6">
      <div className="flex shrink-0 items-center gap-3 pt-4 pb-4">
        <div>
          <h1 className="truncate text-base font-semibold tracking-tight">Tenant Management</h1>
          <p className="text-xs text-muted-foreground">
            Manage all tenants across the platform. Create, activate, or deactivate tenant organizations.
          </p>
        </div>
      </div>
      <TenantsClient />
    </div>
  );
}
