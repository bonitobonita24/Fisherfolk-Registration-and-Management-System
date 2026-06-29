import { PageHeader } from "@/components/shared";
import { VesselsListClient } from "./vessels-list-client";

export default function VesselsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vessels"
        description="Manage vessel registrations, classifications, and gear types."
      />
      <VesselsListClient />
    </div>
  );
}
