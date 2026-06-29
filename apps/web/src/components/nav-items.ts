import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Ship,
  AlertTriangle,
  FileEdit,
  KanbanSquare,
  FileText,
  BarChart3,
  Upload,
  CreditCard,
  Map,
  Bell,
  Settings,
  UserCog,
  ScrollText,
  HandHeart,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  roles: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        roles: ["super_admin", "admin", "encoder", "viewer"],
      },
      {
        label: "Notifications",
        icon: Bell,
        href: "/notifications",
        roles: ["super_admin", "admin", "encoder", "viewer", "bantay_dagat"],
      },
      {
        label: "Analytics",
        icon: BarChart3,
        href: "/analytics",
        roles: ["super_admin", "admin"],
      },
      {
        label: "Map",
        icon: Map,
        href: "/map",
        roles: ["super_admin", "admin", "viewer"],
      },
    ],
  },
  {
    label: "Records",
    items: [
      {
        label: "Fisherfolk",
        icon: Users,
        href: "/fisherfolk",
        roles: ["super_admin", "admin", "encoder", "viewer", "bantay_dagat"],
      },
      {
        label: "Vessels",
        icon: Ship,
        href: "/vessels",
        roles: ["super_admin", "admin", "encoder", "viewer", "bantay_dagat"],
      },
      {
        label: "Violations",
        icon: AlertTriangle,
        href: "/violations",
        roles: ["super_admin", "admin", "bantay_dagat"],
      },
      {
        label: "Ayuda",
        icon: HandHeart,
        href: "/ayuda",
        roles: ["super_admin", "admin"],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Edit Requests",
        icon: FileEdit,
        href: "/edit-requests",
        roles: ["super_admin", "admin", "encoder"],
      },
      {
        label: "Kanban",
        icon: KanbanSquare,
        href: "/kanban",
        roles: ["super_admin", "admin", "encoder"],
      },
      {
        label: "Reports",
        icon: FileText,
        href: "/reports",
        roles: ["super_admin", "admin", "viewer"],
      },
      {
        label: "Data Import",
        icon: Upload,
        href: "/import",
        roles: ["super_admin", "admin"],
      },
      {
        label: "ID Generator",
        icon: CreditCard,
        href: "/id-generator",
        roles: ["super_admin", "admin", "encoder"],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Audit Log",
        icon: ScrollText,
        href: "/audit-log",
        roles: ["super_admin", "admin"],
      },
      {
        label: "User Management",
        icon: UserCog,
        href: "/user-management",
        roles: ["super_admin", "admin"],
      },
      {
        label: "Settings",
        icon: Settings,
        href: "/settings",
        roles: ["super_admin", "admin"],
      },
    ],
  },
];
