import { PageHeader } from "@/components/shared/page-header";
import { AgendaCalendarClient } from "./agenda-calendar-client";

/**
 * FIS-35 — the tenant HOME is now a Calendar of Activities (personal +
 * shared + announced + entity-sourced agenda items). The former heatmap/
 * analytics dashboard that used to live at this route moved intact to
 * `/insights` (see `../insights/page.tsx`).
 */
export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      <PageHeader
        title="Calendar"
        description="Your agenda — personal tasks, shared items, announcements, and record-linked activities."
        className="pb-0"
      />
      <AgendaCalendarClient />
    </div>
  );
}
