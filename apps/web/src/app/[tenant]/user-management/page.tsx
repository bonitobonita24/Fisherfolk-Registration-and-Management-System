import { PageHeader } from "@/components/shared";

export default function UserManagementPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and access permissions within this tenant."
      />
    </div>
  );
}
