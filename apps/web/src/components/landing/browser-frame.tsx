import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A lightweight browser chrome around a product screenshot — three traffic
 * lights + a muted address bar. Purely decorative.
 */
export function BrowserFrame({
  children,
  url,
  className,
}: {
  children: ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card ring-1 ring-border/40",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[hsl(0_72%_60%)]" />
        <span className="h-3 w-3 rounded-full bg-[hsl(45_100%_55%)]" />
        <span className="h-3 w-3 rounded-full bg-[hsl(145_55%_50%)]" />
        {url ? (
          <div className="ml-3 hidden flex-1 truncate rounded-md bg-background/70 px-3 py-1 text-center text-xs text-muted-foreground sm:block">
            {url}
          </div>
        ) : null}
      </div>
      <div className="bg-background">{children}</div>
    </div>
  );
}
