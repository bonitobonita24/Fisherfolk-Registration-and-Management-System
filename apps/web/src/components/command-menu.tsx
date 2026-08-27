"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Actor } from "@frms/shared/rbac";
import type { UserRole } from "@frms/shared/types";

import { NAV_GROUPS, canSeeNavItem } from "@/components/nav-items";
import { useTenantHref } from "@/lib/use-tenant-href";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

/**
 * Wave-4 additive capability — a ⌘K command palette. Reuses the same
 * NAV_GROUPS + canSeeNavItem visibility resolver as the sidebar, so a
 * user only ever sees palette entries they are already permitted to see.
 */
export function CommandMenu({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const tenantHref = useTenantHref();
  const actor: Actor = { role };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function goTo(href: string) {
    setOpen(false);
    router.push(tenantHref(href));
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        aria-label="Open command menu"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline-flex">Search…</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => canSeeNavItem(actor, item));
            if (visibleItems.length === 0) {
              return null;
            }
            return (
              <CommandGroup key={group.label} heading={group.label}>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.href}
                      value={`${group.label} ${item.label}`}
                      onSelect={() => goTo(item.href)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
