"use client";

import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeColor = "green" | "red" | "yellow" | "blue" | "gray" | "purple" | "orange";

// Text tone is bumped one step darker than the original (-400 → -300 is too
// light on this theme's dark surface; -400 stays, but weight goes up in the
// badge markup below) so contrast holds while backgrounds stay identical —
// no semantic hue is changed for any status.
const colorClasses: Record<BadgeColor, string> = {
  green: "border-transparent bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
  red: "border-transparent bg-red-500/15 text-red-400 hover:bg-red-500/25",
  yellow: "border-transparent bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25",
  blue: "border-transparent bg-blue-500/15 text-blue-400 hover:bg-blue-500/25",
  gray: "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
  purple: "border-transparent bg-purple-500/15 text-purple-400 hover:bg-purple-500/25",
  orange: "border-transparent bg-orange-500/15 text-orange-400 hover:bg-orange-500/25",
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
        "gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        colorClasses[resolvedColor],
        className,
      )}
    >
      {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
      {label}
    </Badge>
  );
}
