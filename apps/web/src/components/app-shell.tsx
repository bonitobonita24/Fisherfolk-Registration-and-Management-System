"use client";

import { useState } from "react";
import type React from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UserRole } from "@frms/shared/types";

interface AppShellProps {
  tenantSlug: string;
  role: UserRole;
  userName: string;
  children: React.ReactNode;
}

export function AppShell({ tenantSlug, role, userName, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((v) => !v);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      {/* Desktop sidebar — collapses to icon rail (w-14) when toggled.
          NexaCRM: sidebar sits directly on the page; border moved to the content box. */}
      <div
        className={cn(
          "hidden shrink-0 md:flex",
          sidebarCollapsed ? "w-14" : "w-64",
        )}
      >
        <Sidebar
          tenantSlug={tenantSlug}
          role={role}
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>
      {/* Mobile sidebar (Sheet) — unchanged */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar
            tenantSlug={tenantSlug}
            role={role}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
      {/* Main column — NexaCRM framed content box (header + scroll area) */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background md:border md:border-border xl:rounded-tl-3xl">
        {/* S3 will add onToggleSidebar prop to Header and expose a header-level toggle button */}
        <Header
          userName={userName}
          role={role}
          onMenuClick={() => setMobileOpen(true)}
          onToggleSidebar={toggleSidebar}
        />
        <main id="main-content" className="flex-1 overflow-y-auto bg-background px-4 pb-4">
          {children}
        </main>
      </div>
    </div>
  );
}
