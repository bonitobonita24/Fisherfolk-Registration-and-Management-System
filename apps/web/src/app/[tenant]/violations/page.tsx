import { ViolationsListClient } from "./violations-list-client";

export default function ViolationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Violations</h1>
        <p className="text-muted-foreground">
          Track and manage fishery violations, penalties, and resolutions.
        </p>
      </div>
      <ViolationsListClient />
    </div>
  );
}
