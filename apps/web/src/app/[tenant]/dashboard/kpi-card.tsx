import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | string;
  Icon: LucideIcon;
  loading?: boolean;
  /** Optional mini chart / progress element — rendered below the value */
  sparkline?: React.ReactNode;
  /**
   * Tinted Tailwind pair for the icon chip, e.g.
   * "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400".
   * Defaults to the tenant-aware accent surface (bg-primary/10 text-primary).
   */
  tone?: string;
}

export function KpiCard({ title, value, Icon, loading, sparkline, tone }: KpiCardProps) {
  return (
    <Card className="gap-0 py-5">
      <CardContent className="space-y-3 px-6 py-0">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              tone ?? "bg-primary/10 text-primary",
            )}
          >
            <Icon className="size-[1.125rem]" aria-hidden="true" />
          </span>
          <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">
            {title}
          </p>
        </div>
        {loading === true ? (
          <div className="h-7 w-16 animate-pulse rounded bg-muted" aria-hidden="true" />
        ) : (
          <p className="truncate text-[28px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        )}
        {sparkline != null && loading !== true && <div>{sparkline}</div>}
      </CardContent>
    </Card>
  );
}
