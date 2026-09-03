import { ShieldAlert } from "lucide-react";

import { auth } from "@/server/auth";
import { PageHeader } from "@/components/shared";

import { UsersClient } from "./users-client";

/**
 * User Management (FIS-7) — tenant_admin+ (tenant_admin / tenant_superadmin /
 * tenant_manager). NOT a FeatureKey (Rule 34 — user_management is
 * deliberately excluded from the custom-role matrix; see
 * route-feature-map.ts + nav-items.ts). Guarded by fixed role list only,
 * same in-page-notice pattern as Settings → Role Builder.
 */
export default async function UserManagementPage() {
  const session = await auth();
  const role = session?.user?.role;
  const isAdmin =
    role === "tenant_manager" ||
    role === "tenant_superadmin" ||
    role === "tenant_admin";

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="User Management"
          description="Manage user accounts, roles, and access permissions within this tenant."
        />
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm"
        >
          <ShieldAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold text-destructive">
              Administrator access required
            </p>
            <p className="mt-1 text-muted-foreground">
              Only tenant administrators can manage user accounts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and access permissions within this tenant."
      />
      <UsersClient />
    </div>
  );
}
