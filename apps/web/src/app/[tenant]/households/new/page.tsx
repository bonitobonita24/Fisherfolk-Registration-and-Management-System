import { HouseholdWizard } from "../household-wizard";

export default function NewHouseholdPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Create Household</h1>
      <p className="text-muted-foreground">
        Select a head fisherfolk, add members, then review before saving.
      </p>
      <HouseholdWizard />
    </div>
  );
}
