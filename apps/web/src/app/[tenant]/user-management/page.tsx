export default function UserManagementPage() {
  return (
    <div className="space-y-4">
      <div className="flex shrink-0 items-center gap-3 pb-4 pt-4">
        <h1 className="truncate text-base font-semibold tracking-tight">
          User Management
        </h1>
      </div>
      <p className="text-xs text-muted-foreground">
        Manage user accounts, roles, and access permissions within this tenant.
      </p>
    </div>
  );
}
