import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  title: string;
  hint?: string;
  loading?: boolean;
  className?: string;
  /**
   * Tinted Tailwind pair for the icon chip, e.g.
   * "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400".
   * Defaults to the tenant-aware accent surface (bg-primary/10 text-primary).
   */
  tone?: string;
}

export function StatCard({
  icon,
  value,
  title,
  hint,
  loading,
  className,
  tone,
}: StatCardProps) {
  return (
    <Card className={cn("gap-0 py-5", className)}>
      <CardContent className="space-y-3 px-6 py-0">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              tone ?? "bg-primary/10 text-primary",
            )}
          >
            {icon}
          </span>
          <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">
            {title}
          </p>
        </div>
        {loading === true ? (
          <Skeleton className="h-7 w-24" />
        ) : typeof value === "number" ? (
          <NumberTicker
            value={value}
            className="truncate text-[28px] font-semibold leading-none tracking-tight tabular-nums text-foreground"
          />
        ) : (
          <p className="truncate text-[28px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
            {value}
          </p>
        )}
        {hint ? (
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
