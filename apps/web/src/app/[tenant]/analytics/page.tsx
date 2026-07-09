import { AnalyticsTabs } from "./analytics-tabs";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
      <p className="text-muted-foreground">
        Visual analytics and demographic intelligence dashboards.
      </p>
      <AnalyticsTabs />
    </div>
  );
}
