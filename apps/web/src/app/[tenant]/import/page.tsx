import { PageHeader } from "@/components/shared";
import { ImportWizard } from "./import-wizard";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Import"
        description="Bulk-import fisherfolk records from a spreadsheet with validation preview."
      />
      <ImportWizard />
    </div>
  );
}
