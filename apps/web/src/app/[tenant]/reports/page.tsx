import { PageHeader } from "@/components/shared";
import { ReportsClient } from "./reports-client";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate official government reports with standardized headers and formats."
      />
      <ReportsClient />
    </div>
  );
}
