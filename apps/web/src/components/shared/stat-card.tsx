import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";
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
}

export function StatCard({
  icon,
  value,
  title,
  hint,
  loading,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("gap-4", className)}>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex min-w-0 flex-col">
          {loading === true ? (
            <Skeleton className="h-8 w-24" />
          ) : typeof value === "number" ? (
            <NumberTicker
              value={value}
              className="text-2xl font-bold text-foreground"
            />
          ) : (
            <span className="text-2xl font-bold text-foreground">{value}</span>
          )}
          <span className="truncate text-sm text-muted-foreground">{title}</span>
          {hint ? (
            <span className="text-xs text-muted-foreground">{hint}</span>
          ) : null}
        </div>
      </CardHeader>
    </Card>
  );
}
