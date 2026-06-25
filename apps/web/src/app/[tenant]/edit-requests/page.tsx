import { EditRequestsListClient } from "./edit-requests-list-client";

export default function EditRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Requests</h1>
        <p className="text-muted-foreground">
          Review and action pending fisherfolk profile edit requests.
        </p>
      </div>
      <EditRequestsListClient />
    </div>
  );
}
