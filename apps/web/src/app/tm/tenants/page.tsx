import { TenantsClient } from "./tenants-client";

export default function TenantsPage() {
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
