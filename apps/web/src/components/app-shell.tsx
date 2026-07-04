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

interface AppShellProps {
  tenantSlug: string;
  role: string;
  userName: string;
  children: React.ReactNode;
}

export function AppShell({ tenantSlug, role, userName, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((v) => !v);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Desktop sidebar — collapses to icon rail (w-14) when toggled */}
      <div
        className={cn(
          "hidden shrink-0 border-r border-border md:flex",
          sidebarCollapsed ? "w-14" : "w-56",
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
        <SheetContent side="left" className="w-56 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar
            tenantSlug={tenantSlug}
            role={role}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* S3 will add onToggleSidebar prop to Header and expose a header-level toggle button */}
        <Header
          userName={userName}
          role={role}
          tenantSlug={tenantSlug}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-background p-3 md:p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
