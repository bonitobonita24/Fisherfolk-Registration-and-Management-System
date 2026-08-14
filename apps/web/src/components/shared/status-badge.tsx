"use client";

import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeColor = "green" | "red" | "yellow" | "blue" | "gray" | "purple" | "orange";

// NexaCRM tinted-pair pattern (port map §3.5): light `bg-{hue}-50 text-{hue}-700`
// / dark `bg-{hue}-950 text-{hue}-400`. Light text uses -700 (not the template's
// -600) so 11px text holds WCAG AA 4.5:1 on the -50 tint (§5.1 hard gate) —
// no semantic hue is changed for any status.
const colorClasses: Record<BadgeColor, string> = {
  green: "border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  red: "border-transparent bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  yellow: "border-transparent bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  blue: "border-transparent bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  gray: "border-transparent bg-muted text-muted-foreground",
  purple: "border-transparent bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  orange: "border-transparent bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
};

const statusColorMap: Record<string, BadgeColor> = {
  // FisherfolkStatus
  NEW: "blue",
  ACTIVE: "green",
  RENEWED: "green",
  INACTIVE: "yellow",
  ARCHIVED: "gray",

  // VesselStatus
  IMPOUNDED: "red",

  // ViolationStatus
  LIFTED: "green",

  // EditRequestStatus
  PENDING: "yellow",
  APPROVED: "green",
  REJECTED: "red",

  // UserStatus
  DEACTIVATED: "red",

  // KanbanTaskStatus
  TODO: "gray",
  IN_PROGRESS: "blue",
  DONE: "green",

  // KanbanTaskPriority
  LOW: "gray",
  MEDIUM: "yellow",
  HIGH: "orange",
  URGENT: "red",

  // AyudaProgramStatus
  DRAFT: "gray",
  COMPLETED: "blue",
  CANCELLED: "red",

  // AyudaBeneficiaryStatus
  RECEIVED: "green",

  // CategoryStatus
  DISABLED: "red",

  // IDTemplateStatus (reuses ACTIVE/ARCHIVED)

  // CommentTicketStatus
  OPEN: "yellow",
  RESOLVED: "green",
};

interface StatusBadgeProps {
  status: string;
  color?: BadgeColor;
  /** Optional leading icon — reinforces the label, never replaces it (text stays visible for a11y). */
  icon?: LucideIcon;
  className?: string;
}

export function StatusBadge({
  status,
  color,
  icon: Icon,
  className,
}: StatusBadgeProps) {
  const resolvedColor = color ?? statusColorMap[status] ?? "gray";
  const label = status.replace(/_/g, " ");

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        colorClasses[resolvedColor],
        className,
      )}
    >
      {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
      {label}
    </Badge>
  );
}
