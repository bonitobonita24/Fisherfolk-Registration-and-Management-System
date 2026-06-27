import { ImportWizard } from "./import-wizard";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Data Import</h1>
      <p className="text-muted-foreground">
        Bulk-import fisherfolk records from a spreadsheet with validation preview.
      </p>
      <ImportWizard />
    </div>
  );
}
