import { PageHeader } from "@/components/shared";

export default function AuditLogPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Audit Log"
        description="View immutable audit trail of all system actions and data changes."
      />
    </div>
  );
}
