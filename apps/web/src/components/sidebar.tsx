"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/components/nav-items";
import { Ship } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  tenantSlug: string;
  role: string;
  onNavigate?: () => void;
}

export function Sidebar({ tenantSlug, role, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col bg-card">
      {/* Logo block */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Link
          href={`/${tenantSlug}/dashboard`}
          className="flex items-center gap-2"
          onClick={() => onNavigate?.()}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Ship className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold text-foreground">FRMS</span>
            <span className="text-[10px] text-muted-foreground">Fisherfolk MS</span>
          </span>
        </Link>
      </div>

      {/* Scrollable nav */}
      <ScrollArea className="flex-1">
        <nav className="p-2">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((i) => i.roles.includes(role));
            if (items.length === 0) return null;

            return (
              <div key={group.label}>
                <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const fullHref = `/${tenantSlug}${item.href}`;
                    const isActive = pathname.startsWith(fullHref);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={fullHref}
                          onClick={() => onNavigate?.()}
                          className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? "bg-primary/10 font-medium text-primary before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="mt-auto border-t border-border p-3 text-[10px] text-muted-foreground">
        FRMS · {tenantSlug}
      </div>
    </aside>
  );
}
