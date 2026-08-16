import { UsersClient } from "./users-client";

export default async function TenantUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex shrink-0 items-center gap-3 pt-4 pb-4">
        <div>
          <h1 className="truncate text-base font-semibold tracking-tight">
            Tenant User Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage users within this tenant. Create accounts, reset passwords, or
            deactivate access.
          </p>
        </div>
      </div>
      <UsersClient tenantId={id} />
    </div>
  );
}
