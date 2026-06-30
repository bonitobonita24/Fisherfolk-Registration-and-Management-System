import { UsersClient } from "./users-client";

export default async function TenantUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        Tenant User Management
      </h1>
      <p className="text-muted-foreground">
        Manage users within this tenant. Create accounts, reset passwords, or
        deactivate access.
      </p>
      <UsersClient tenantId={id} />
    </div>
  );
}
