/**
 * Sidebar nav visibility — PURE unit tests. No DB, no render, no network.
 *
 * PD-005 Chunk 5: the sidebar nav filter is now feature-permission-driven
 * via `canSeeNavItem` (nav-items.ts), which resolves gateable items through
 * the shared `hasPermission()` matrix resolver (surface #3 of the
 * 3-surface enforcement pattern — see
 * ~/.claude/rules/tenant-rbac-standard.md §4) and falls back to
 * `alwaysVisible` / `minRoles` for the two items that are deliberately NOT
 * FeatureKey-gateable (User Management, Settings — billing/user_management
 * can never be matrix-gated, per the RBAC standard's Guardrails).
 *
 * We test the pure `canSeeNavItem` helper directly rather than rendering
 * <Sidebar> — it needs no DOM, no session provider, and no router mocking,
 * and it is the exact function the component calls to filter each group.
 * (A render test was considered unnecessary: the component-level filter is
 * a single `.filter((i) => canSeeNavItem(actor, i))` call with no branching
 * logic of its own — the pure-helper tests below are sufficient coverage.)
 */
import { describe, expect, it } from "vitest";

import { UserRole } from "@frms/shared/types";
import type { Actor, PermissionMatrix } from "@frms/shared/rbac";
import { NAV_GROUPS, canSeeNavItem, type NavItem } from "../nav-items";

const ALL_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

function visibleLabels(actor: Actor): string[] {
  return ALL_ITEMS.filter((i) => canSeeNavItem(actor, i)).map((i) => i.label);
}

describe("canSeeNavItem — Calendar is alwaysVisible for every authenticated role", () => {
  const roles: UserRole[] = [
    UserRole.TENANT_MANAGER,
    UserRole.TENANT_SUPERADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.ENCODER,
    UserRole.VIEWER,
    UserRole.BANTAY_DAGAT,
  ];

  for (const role of roles) {
    it(`${role} sees Calendar`, () => {
      expect(visibleLabels({ role })).toContain("Calendar");
    });
  }

  it("a custom-role actor with an empty matrix still sees Calendar", () => {
    expect(visibleLabels({ role: UserRole.ENCODER, matrix: {} })).toContain(
      "Calendar",
    );
  });
});

describe("canSeeNavItem — tenant_admin: every feature item, NOT User Management/Settings", () => {
  const labels = visibleLabels({ role: UserRole.TENANT_ADMIN });

  it("sees every feature-gated item (ceiling grants view on all FeatureKeys)", () => {
    const featureItems = ALL_ITEMS.filter((i) => i.feature !== undefined);
    for (const item of featureItems) {
      expect(labels).toContain(item.label);
    }
  });

  it("does NOT see User Management or Settings (excluded from tenant_admin ceiling by design)", () => {
    expect(labels).not.toContain("User Management");
    expect(labels).not.toContain("Settings");
  });
});

describe("canSeeNavItem — tenant_superadmin / tenant_manager: the full nav, including owner-only items", () => {
  for (const role of [UserRole.TENANT_SUPERADMIN, UserRole.TENANT_MANAGER]) {
    it(`${role} sees every nav item`, () => {
      const labels = visibleLabels({ role });
      expect(labels).toEqual(ALL_ITEMS.map((i) => i.label));
    });
  }
});

describe("canSeeNavItem — viewer: view-able on every feature, never the owner-only items", () => {
  const labels = visibleLabels({ role: UserRole.VIEWER });

  it("sees every feature-gated item (viewer preset grants view on all FeatureKeys)", () => {
    const featureItems = ALL_ITEMS.filter((i) => i.feature !== undefined);
    for (const item of featureItems) {
      expect(labels).toContain(item.label);
    }
  });

  it("does NOT see User Management, Settings, or Role Builder (role fallback excludes viewer)", () => {
    expect(labels).not.toContain("User Management");
    expect(labels).not.toContain("Settings");
    expect(labels).not.toContain("Role Builder");
  });
});

describe("canSeeNavItem — encoder: only its operational write+update features", () => {
  const labels = visibleLabels({ role: UserRole.ENCODER });

  const expectedVisible = [
    "Calendar",
    "Insights",
    "Fisherfolk",
    "Household",
    "Vessels",
    "Fish Catches",
    "Edit Requests",
    "ToDo",
    "ID Generator",
    "Notifications",
  ];
  const expectedHidden = [
    "Violations",
    "Ayuda",
    "Reports",
    "Analytics",
    "Map",
    "Data Import",
    "Audit Log",
    "User Management",
    "Settings",
    "Role Builder",
  ];

  it.each(expectedVisible)("sees %s", (label) => {
    expect(labels).toContain(label);
  });

  it.each(expectedHidden)("does NOT see %s", (label) => {
    expect(labels).not.toContain(label);
  });
});

describe("canSeeNavItem — bantay_dagat: enforcement-scoped view+write subset", () => {
  const labels = visibleLabels({ role: UserRole.BANTAY_DAGAT });

  const expectedVisible = ["Calendar", "Insights", "Violations", "Fisherfolk", "Vessels", "Fish Catches"];
  const expectedHidden = [
    "Household",
    "Ayuda",
    "Edit Requests",
    "ToDo",
    "Reports",
    "Analytics",
    "Map",
    "Data Import",
    "ID Generator",
    "Audit Log",
    "Notifications",
    "User Management",
    "Settings",
    "Role Builder",
  ];

  it.each(expectedVisible)("sees %s", (label) => {
    expect(labels).toContain(label);
  });

  it.each(expectedHidden)("does NOT see %s", (label) => {
    expect(labels).not.toContain(label);
  });
});

describe("canSeeNavItem — custom role (matrix): deny-by-default, only the granted feature + alwaysVisible items", () => {
  const matrix: PermissionMatrix = {
    fisherfolk: { view: true, write: false, update: false, delete: false },
  };
  const labels = visibleLabels({ role: UserRole.ENCODER, matrix });

  it("sees Calendar + Insights (alwaysVisible) and Fisherfolk (the one granted feature)", () => {
    expect(labels).toEqual(
      expect.arrayContaining(["Calendar", "Insights", "Fisherfolk"]),
    );
  });

  it("sees nothing else — every other feature item is denied", () => {
    const otherFeatureLabels = ALL_ITEMS.filter(
      (i) => i.feature !== undefined && i.feature !== "fisherfolk",
    ).map((i) => i.label);
    for (const label of otherFeatureLabels) {
      expect(labels).not.toContain(label);
    }
  });

  it("the matrix supersedes the encoder preset the role would otherwise imply (e.g. Household is preset-granted but matrix-denied)", () => {
    expect(labels).not.toContain("Household");
  });

  it("never sees User Management, Settings, or Role Builder — those can never be matrix-gated", () => {
    expect(labels).not.toContain("User Management");
    expect(labels).not.toContain("Settings");
    expect(labels).not.toContain("Role Builder");
  });
});

describe("canSeeNavItem — an item with no feature/alwaysVisible/minRoles is deny-by-default", () => {
  it("returns false for a misconfigured item", () => {
    const misconfigured: NavItem = {
      label: "Misconfigured",
      icon: ALL_ITEMS[0]!.icon,
      href: "/nowhere",
    };
    expect(canSeeNavItem({ role: UserRole.TENANT_MANAGER }, misconfigured)).toBe(
      false,
    );
  });
});
