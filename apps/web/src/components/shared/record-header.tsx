import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecordHeaderProps {
  /** List route the back arrow returns to. */
  backHref: string;
  /** Accessible label for the back arrow (e.g. "Back to vessels"). */
  backLabel?: string;
  title: string;
  /** Small muted line under the title (ID number, program period, …). */
  meta?: ReactNode;
  /** Status badge slot — rendered next to the title, hidden on very small screens. */
  badge?: ReactNode;
  /** Right-aligned actions cluster (outline/sm buttons, dialogs, …). */
  actions?: ReactNode;
  className?: string;
}

/**
 * NexaCRM record-detail header strip (port map §3.7).
 * Ghost back-arrow + title + status badge, actions clustered right.
 */
export function RecordHeader({
  backHref,
  backLabel = "Back",
  title,
  meta,
  badge,
  actions,
  className,
}: RecordHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-3 border-b pb-2 pt-4",
        className,
      )}
    >
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="-ml-1 size-8 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <Link href={backHref} aria-label={backLabel}>
          <ArrowLeft className="size-4" />
        </Link>
      </Button>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-base font-semibold tracking-tight">
            {title}
          </h1>
          {badge != null ? (
            <span className="shrink-0 max-sm:hidden">{badge}</span>
          ) : null}
        </div>
        {meta != null ? (
          <p className="truncate text-xs text-muted-foreground">{meta}</p>
        ) : null}
      </div>
      {actions != null ? (
        <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
