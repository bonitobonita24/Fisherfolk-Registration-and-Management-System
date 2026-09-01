import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DetailFieldProps {
  label: string;
  value: ReactNode;
  className?: string;
}

/**
 * NexaCRM detail field (port map §3.7): `text-xs text-muted-foreground`
 * label over a `text-sm` value; em-dash for empty values.
 */
export function DetailField({ label, value, className }: DetailFieldProps) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <p className="text-[0.95rem] text-muted-foreground">{label}</p>
      <div className="text-[1.125rem] text-foreground [overflow-wrap:anywhere]">
        {empty ? "—" : value}
      </div>
    </div>
  );
}

interface DefinitionGridProps {
  /** Column count at wide widths (defaults to 3). Always 1 column on mobile. */
  columns?: 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}

/**
 * Multi-column definition grid for record sections — fills the available
 * width instead of leaving dead space (port map §3.7 detail idiom).
 */
export function DefinitionGrid({
  columns = 3,
  children,
  className,
}: DefinitionGridProps) {
  const cols =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={cn("grid grid-cols-1 gap-x-5 gap-y-2.5", cols, className)}>
      {children}
    </div>
  );
}

interface FieldRailProps {
  children: ReactNode;
  className?: string;
}

/**
 * 20rem left fields rail for person-detail layouts (port map §3.7).
 * Compose inside `grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]`.
 */
export function FieldRail({ children, className }: FieldRailProps) {
  return (
    <div className={cn("space-y-3 xl:border-r xl:py-4 xl:pr-6", className)}>
      {children}
    </div>
  );
}
