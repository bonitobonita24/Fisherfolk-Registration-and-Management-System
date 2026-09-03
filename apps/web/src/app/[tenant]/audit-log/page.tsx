import { PageHeader } from "@/components/shared";
import { AuditLogListClient } from "./audit-log-list-client";

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="View immutable audit trail of all system actions and data changes."
      />
      <AuditLogListClient />
    </div>
  );
}
