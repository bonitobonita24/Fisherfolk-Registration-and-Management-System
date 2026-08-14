import { PageHeader } from "@/components/shared/page-header";
import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description="Overview of fisherfolk registration and management statistics."
        className="pb-0"
      />
      <DashboardClient />
    </div>
  );
}
