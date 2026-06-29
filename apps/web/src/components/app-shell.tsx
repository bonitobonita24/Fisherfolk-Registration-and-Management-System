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

interface AppShellProps {
  tenantSlug: string;
  role: string;
  userName: string;
  children: React.ReactNode;
}

export function AppShell({ tenantSlug, role, userName, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden w-60 shrink-0 border-r border-border md:flex">
        <Sidebar tenantSlug={tenantSlug} role={role} />
      </div>
      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar tenantSlug={tenantSlug} role={role} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={userName} role={role} tenantSlug={tenantSlug} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
