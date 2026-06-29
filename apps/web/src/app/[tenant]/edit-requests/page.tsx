import { PageHeader } from "@/components/shared";
import { EditRequestsListClient } from "./edit-requests-list-client";

export default function EditRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Requests"
        description="Review and action pending fisherfolk profile edit requests."
      />
      <EditRequestsListClient />
    </div>
  );
}
