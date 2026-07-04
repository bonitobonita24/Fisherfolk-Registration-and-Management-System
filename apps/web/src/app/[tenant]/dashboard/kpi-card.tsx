import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: number | string;
  Icon: LucideIcon;
  loading?: boolean;
  /** Optional mini chart / progress element — rendered below the value */
  sparkline?: React.ReactNode;
}

export function KpiCard({ title, value, Icon, loading, sparkline }: KpiCardProps) {
  return (
    <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {title}
          </p>
          {loading === true ? (
            <div className="mt-1 h-7 w-16 animate-pulse rounded bg-muted" aria-hidden="true" />
          ) : (
            <p className="mt-0.5 text-2xl font-bold leading-none text-foreground">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          )}
        </div>
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      {sparkline != null && loading !== true && <div className="mt-2">{sparkline}</div>}
    </div>
  );
}
