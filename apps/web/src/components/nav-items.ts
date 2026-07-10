import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Ship,
  Fish,
  AlertTriangle,
  FileEdit,
  ListTodo,
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
  Home,
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
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin", "encoder", "viewer"],
      },
      {
        label: "Notifications",
        icon: Bell,
        href: "/notifications",
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin", "encoder", "viewer", "bantay_dagat"],
      },
      {
        label: "Analytics",
        icon: BarChart3,
        href: "/analytics",
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin"],
      },
      {
        label: "Map",
        icon: Map,
        href: "/map",
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin", "viewer"],
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
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin", "encoder", "viewer", "bantay_dagat"],
      },
      {
        label: "Household",
        icon: Home,
        href: "/households",
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin", "encoder", "viewer", "bantay_dagat"],
      },
      {
        label: "Vessels",
        icon: Ship,
        href: "/vessels",
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin", "encoder", "viewer", "bantay_dagat"],
      },
      {
        label: "Fish Catches",
        icon: Fish,
        href: "/fish-catches",
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin", "encoder", "viewer", "bantay_dagat"],
      },
      {
        label: "Violations",
        icon: AlertTriangle,
        href: "/violations",
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin", "bantay_dagat"],
      },
      {
        label: "Ayuda",
        icon: HandHeart,
        href: "/ayuda",
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin"],
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
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin", "encoder"],
      },
      {
        label: "ToDo",
        icon: ListTodo,
        href: "/todo",
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin", "encoder"],
      },
      {
        label: "Reports",
        icon: FileText,
        href: "/reports",
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin", "viewer"],
      },
      {
        label: "Data Import",
        icon: Upload,
        href: "/import",
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin"],
      },
      {
        label: "ID Generator",
        icon: CreditCard,
        href: "/id-generator",
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin", "encoder"],
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
        roles: ["tenant_manager", "tenant_superadmin", "tenant_admin"],
      },
      {
        label: "User Management",
        icon: UserCog,
        href: "/user-management",
        roles: ["tenant_manager", "tenant_superadmin"],
      },
      {
        label: "Settings",
        icon: Settings,
        href: "/settings",
        roles: ["tenant_manager", "tenant_superadmin"],
      },
    ],
  },
];
