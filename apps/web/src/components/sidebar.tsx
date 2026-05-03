"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Ship,
  AlertTriangle,
  FileEdit,
  KanbanSquare,
  FileText,
  BarChart3,
  CreditCard,
  Map,
  Bell,
  Settings,
  UserCog,
  ScrollText,
  HandHeart,
} from "lucide-react";

interface SidebarProps {
  tenantSlug: string;
  role: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", roles: ["super_admin", "admin", "encoder", "viewer"] },
  { label: "Fisherfolk", icon: Users, href: "/fisherfolk", roles: ["super_admin", "admin", "encoder", "viewer", "bantay_dagat"] },
  { label: "Vessels", icon: Ship, href: "/vessels", roles: ["super_admin", "admin", "encoder", "viewer", "bantay_dagat"] },
  { label: "Violations", icon: AlertTriangle, href: "/violations", roles: ["super_admin", "admin", "bantay_dagat"] },
  { label: "Edit Requests", icon: FileEdit, href: "/edit-requests", roles: ["super_admin", "admin", "encoder"] },
  { label: "Kanban", icon: KanbanSquare, href: "/kanban", roles: ["super_admin", "admin", "encoder"] },
  { label: "Reports", icon: FileText, href: "/reports", roles: ["super_admin", "admin", "viewer"] },
  { label: "Analytics", icon: BarChart3, href: "/analytics", roles: ["super_admin", "admin"] },
  { label: "ID Generator", icon: CreditCard, href: "/id-generator", roles: ["super_admin", "admin", "encoder"] },
  { label: "Map", icon: Map, href: "/map", roles: ["super_admin", "admin", "viewer"] },
  { label: "Ayuda", icon: HandHeart, href: "/ayuda", roles: ["super_admin", "admin"] },
  { label: "Notifications", icon: Bell, href: "/notifications", roles: ["super_admin", "admin", "encoder", "viewer", "bantay_dagat"] },
  { label: "Audit Log", icon: ScrollText, href: "/audit-log", roles: ["super_admin", "admin"] },
  { label: "User Management", icon: UserCog, href: "/user-management", roles: ["super_admin", "admin"] },
  { label: "Settings", icon: Settings, href: "/settings", roles: ["super_admin", "admin"] },
];

export function Sidebar({ tenantSlug, role }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href={`/${tenantSlug}/dashboard`} className="text-lg font-bold text-foreground">
          FRMS
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const fullHref = `/${tenantSlug}${item.href}`;
            const isActive = pathname.startsWith(fullHref);
            return (
              <li key={item.href}>
                <Link
                  href={fullHref}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
