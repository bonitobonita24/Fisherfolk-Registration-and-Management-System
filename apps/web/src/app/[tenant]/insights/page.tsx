import { PageHeader } from "@/components/shared/page-header";
import { DashboardClient } from "./dashboard-client";

/**
 * FIS-35 — the analytics/heatmap surface relocated from `/dashboard`
 * (now the calendar-of-activities home) to `/insights`. Behavior is
 * unchanged from the former dashboard page; only the route + nav label
 * moved. See `agenda-calendar-client.tsx` for the new home.
 */
export default function InsightsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Insights"
        description="Overview of fisherfolk registration and management statistics."
        className="pb-0"
      />
      <DashboardClient />
    </div>
  );
}
