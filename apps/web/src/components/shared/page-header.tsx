import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex shrink-0 items-center gap-3 pb-4 pt-4", className)}>
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action != null ? (
        <div className="ml-auto flex shrink-0 items-center gap-2">{action}</div>
      ) : null}
    </div>
  );
}
