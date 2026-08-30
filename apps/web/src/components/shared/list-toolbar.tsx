import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ListToolbarProps {
  /** Filter/search/action controls — laid out left-to-right, wrapping on narrow screens. */
  children: ReactNode;
  className?: string;
}

/**
 * Floating-card toolbar wrapper for list-view filter bars (Cargorix floating-card idiom —
 * matches RecordHeader/FormSection card tokens: border, bg-card, rounded-lg, shadow-sm).
 * Column layout on mobile, row + space-between on sm+ so search/leading content sits left
 * and filter controls sit right. Chrome only — no filter/query logic lives here.
 */
export function ListToolbar({ children, className }: ListToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm",
        "sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}
