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
  ShieldCheck,
  Network,
} from "lucide-react";
import { hasPermission, type Actor, type FeatureKey } from "@frms/shared/rbac";
import type { UserRole } from "@frms/shared/types";

/**
 * PD-005 Chunk 5 — feature-permission-driven sidebar nav.
 *
 * Every gateable nav item carries a `feature: FeatureKey` and is filtered
 * client-side via `hasPermission(actor, feature, "view")` (see
 * `canSeeNavItem` in sidebar.tsx) — surface #3 of the 3-surface enforcement
 * pattern (tRPC / middleware / nav), mirroring
 * ~/.claude/rules/tenant-rbac-standard.md §4.
 *
 * A handful of items do NOT map to a FeatureKey by design — `billing` and
 * `user_management` are deliberately excluded from FeatureKey (see
 * packages/shared/src/rbac/feature-key.ts) so they can never be
 * matrix-gated. Those items fall back to `alwaysVisible` (every
 * authenticated tenant user — e.g. Dashboard) or `minRoles` (a fixed
 * role allow-list — e.g. User Management / Settings, which stay
 * tenant_superadmin + tenant_manager only, per the RBAC standard's
 * Guardrails: custom roles may NEVER grant Billing or User Management).
 */
export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  /** Gateable items: resolved via hasPermission(actor, feature, "view"). */
  feature?: FeatureKey;
  /** Non-gateable items visible to every authenticated tenant user. */
  alwaysVisible?: boolean;
  /** Non-gateable items: fixed role allow-list fallback (never matrix-driven). */
  minRoles?: UserRole[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Pure nav-visibility resolver — surface #3 of the 3-surface enforcement
 * pattern (tRPC / middleware / nav), extracted from sidebar.tsx so it is
 * unit-testable without rendering (see
 * `__tests__/sidebar-visibility.test.ts`).
 *
 * `actor.matrix` is undefined for every user today (no custom-role
 * session-minting yet — that arrives with a later PD-005 chunk); once the
 * matrix rides the session, a custom-role actor filters correctly here
 * with NO further change to this function or to sidebar.tsx.
 */
export function canSeeNavItem(actor: Actor, item: NavItem): boolean {
  if (item.feature !== undefined) {
    return hasPermission(actor, item.feature, "view");
  }
  if (item.alwaysVisible === true) {
    return true;
  }
  if (item.minRoles !== undefined) {
    return item.minRoles.includes(actor.role);
  }
  // A NavItem must declare exactly one of feature / alwaysVisible /
  // minRoles — an item with none of these is a configuration bug and is
  // deny-by-default (mirrors hasPermission's deny-by-default contract).
  return false;
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        // Not a FeatureKey — the tenant home screen, visible to every
        // authenticated tenant user regardless of role/matrix.
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        alwaysVisible: true,
      },
      {
        label: "Notifications",
        icon: Bell,
        href: "/notifications",
        feature: "notifications",
      },
      {
        label: "Analytics",
        icon: BarChart3,
        href: "/analytics",
        feature: "analytics",
      },
      {
        label: "Map",
        icon: Map,
        href: "/map",
        feature: "map",
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
        feature: "fisherfolk",
      },
      {
        label: "Household",
        icon: Home,
        href: "/households",
        feature: "households",
      },
      {
        label: "Municipal Network",
        icon: Network,
        href: "/households/network",
        feature: "households",
      },
      {
        label: "Vessels",
        icon: Ship,
        href: "/vessels",
        feature: "vessels",
      },
      {
        label: "Fish Catches",
        icon: Fish,
        href: "/fish-catches",
        feature: "fish_catches",
      },
      {
        label: "Violations",
        icon: AlertTriangle,
        href: "/violations",
        feature: "violations",
      },
      {
        label: "Ayuda",
        icon: HandHeart,
        href: "/ayuda",
        feature: "ayuda",
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
        feature: "edit_requests",
      },
      {
        // ToDo == the Kanban board — maps to the `kanban` FeatureKey.
        label: "ToDo",
        icon: ListTodo,
        href: "/todo",
        feature: "kanban",
      },
      {
        label: "Reports",
        icon: FileText,
        href: "/reports",
        feature: "reports",
      },
      {
        // Data Import page — maps to the `import` FeatureKey.
        label: "Data Import",
        icon: Upload,
        href: "/import",
        feature: "import",
      },
      {
        label: "ID Generator",
        icon: CreditCard,
        href: "/id-generator",
        feature: "id_generator",
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
        feature: "audit_log",
      },
      {
        // Not a FeatureKey by design — user_management is deliberately
        // excluded from the custom-role matrix (RBAC standard §4
        // Guardrails). Fixed role fallback only.
        label: "User Management",
        icon: UserCog,
        href: "/user-management",
        minRoles: ["tenant_manager", "tenant_superadmin"] as UserRole[],
      },
      {
        // Not a FeatureKey by design — billing/tenant-owner settings stay
        // exclusive to tenant_superadmin + tenant_manager. Fixed role
        // fallback only.
        label: "Settings",
        icon: Settings,
        href: "/settings",
        minRoles: ["tenant_manager", "tenant_superadmin"] as UserRole[],
      },
      {
        // Not a FeatureKey by design — PD-005 Chunk 7 Role Builder. Only
        // tenant_superadmin (and platform tenant_manager) may create/edit/
        // assign custom roles, per tenant-rbac-standard.md §4 Guardrails.
        // Fixed role fallback only, same as User Management / Settings.
        label: "Role Builder",
        icon: ShieldCheck,
        href: "/settings/roles",
        minRoles: ["tenant_manager", "tenant_superadmin"] as UserRole[],
      },
    ],
  },
];
