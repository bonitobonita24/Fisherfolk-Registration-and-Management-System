import { PageHeader } from "@/components/shared";
import { AnalyticsTabs } from "./analytics-tabs";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Visual analytics and demographic intelligence dashboards."
      />
      <AnalyticsTabs />
    </div>
  );
}
