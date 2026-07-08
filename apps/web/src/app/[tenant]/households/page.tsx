import { PageHeader } from "@/components/shared";
import { HouseholdsListClient } from "./households-list-client";

export default function HouseholdsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Household"
        description="Manage household groupings of fisherfolk records."
      />
      <HouseholdsListClient />
    </div>
  );
}
