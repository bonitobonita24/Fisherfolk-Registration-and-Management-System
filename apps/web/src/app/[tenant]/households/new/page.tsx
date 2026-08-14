import { PageHeader } from "@/components/shared";
import { HouseholdWizard } from "../household-wizard";

export default function NewHouseholdPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Household"
        description="Select a head fisherfolk, add members, then review before saving."
      />
      <HouseholdWizard />
    </div>
  );
}
