"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/components/nav-items";
import { Ship, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarProps {
  tenantSlug: string;
  role: string;
  onNavigate?: () => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({
  tenantSlug,
  role,
  onNavigate,
  isCollapsed = false,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full w-full flex-col bg-card">
        {/* Brand block — h-14 per AdminCN spec */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-border",
            isCollapsed ? "justify-center px-2" : "justify-between px-3",
          )}
        >
          {isCollapsed ? (
            /* Collapsed: icon only, centered — toggle button is in the footer slot below */
            <Link
              href={`/${tenantSlug}/dashboard`}
              onClick={() => onNavigate?.()}
              aria-label="FRMS Dashboard"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Ship className="h-4 w-4" />
              </span>
            </Link>
          ) : (
            /* Expanded: icon + text on left, collapse button on right */
            <>
              <Link
                href={`/${tenantSlug}/dashboard`}
                className="flex items-center gap-2"
                onClick={() => onNavigate?.()}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Ship className="h-4 w-4" />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-sm font-semibold text-foreground">FRMS</span>
                  <span className="text-[10px] text-muted-foreground">Fisherfolk MS</span>
                </span>
              </Link>
              {onToggle && (
                <button
                  type="button"
                  onClick={onToggle}
                  aria-label="Collapse sidebar"
                  aria-expanded={true}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Scrollable nav */}
        <ScrollArea className="flex-1">
          <nav className={cn("py-2", isCollapsed ? "px-1.5" : "px-2")}>
            {NAV_GROUPS.map((group) => {
              const items = group.items.filter((i) => i.roles.includes(role));
              if (items.length === 0) return null;

              return (
                <div key={group.label} className="mb-1">
                  {isCollapsed ? (
                    /* Divider between groups in icon-rail mode */
                    <div
                      className="mx-1 my-2 border-t border-border/50"
                      aria-hidden="true"
                    />
                  ) : (
                    <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      const fullHref = `/${tenantSlug}${item.href}`;
                      const isActive = pathname.startsWith(fullHref);
                      const Icon = item.icon;
                      const linkCn = cn(
                        "relative flex items-center rounded-md text-sm transition-colors",
                        isCollapsed ? "justify-center px-2 py-1.5" : "gap-2.5 px-2 py-1.5",
                        isActive
                          ? "bg-[hsl(var(--nav-active-bg))] text-[hsl(var(--nav-active-fg))] font-medium before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      );
                      return (
                        <li key={item.href}>
                          {isCollapsed ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={fullHref}
                                  onClick={() => onNavigate?.()}
                                  className={linkCn}
                                  aria-label={item.label}
                                >
                                  <Icon className="h-4 w-4 shrink-0" />
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="text-xs">
                                {item.label}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Link
                              href={fullHref}
                              onClick={() => onNavigate?.()}
                              className={linkCn}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              {item.label}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer — expander when collapsed, label text when expanded */}
        {isCollapsed && onToggle ? (
          <div className="shrink-0 border-t border-border p-2">
            <button
              type="button"
              onClick={onToggle}
              aria-label="Expand sidebar"
              aria-expanded={false}
              className="flex h-8 w-full items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          !isCollapsed && (
            <div className="shrink-0 space-y-1 border-t border-border p-2.5 text-[10px] text-muted-foreground">
              <p>
                FRMS · {tenantSlug}
                {process.env.NEXT_PUBLIC_APP_VERSION ? (
                  <> · v{process.env.NEXT_PUBLIC_APP_VERSION}</>
                ) : null}
              </p>
              <a
                href="https://www.powerbyteitsolutions.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-sm transition-colors hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Developed by Powerbyte IT Solutions
              </a>
            </div>
          )
        )}
      </aside>
    </TooltipProvider>
  );
}
