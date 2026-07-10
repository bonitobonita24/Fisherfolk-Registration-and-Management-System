import { describe, expect, it } from "vitest";

import { FEATURE_KEYS } from "@frms/shared/rbac";

import {
  buildEmptyGrid,
  gridToPermissions,
  permissionsToGrid,
  setColumn,
  setRow,
  toggleCell,
  validateRoleName,
  type PermissionGrant,
} from "../matrix-transform";

describe("buildEmptyGrid", () => {
  it("covers every FeatureKey with all actions false", () => {
    const grid = buildEmptyGrid();
    expect(Object.keys(grid).sort()).toEqual([...FEATURE_KEYS].sort());
    for (const key of FEATURE_KEYS) {
      expect(grid[key]).toEqual({
        view: false,
        write: false,
        update: false,
        delete: false,
      });
    }
  });
});

describe("permissionsToGrid", () => {
  it("fills matching rows and defaults everything else to false", () => {
    const permissions: PermissionGrant[] = [
      { featureKey: "fisherfolk", view: true, write: true, update: false, delete: false },
    ];
    const grid = permissionsToGrid(permissions);
    expect(grid.fisherfolk).toEqual({
      view: true,
      write: true,
      update: false,
      delete: false,
    });
    expect(grid.vessels).toEqual({
      view: false,
      write: false,
      update: false,
      delete: false,
    });
  });

  it("handles an empty permissions array (brand-new role)", () => {
    const grid = permissionsToGrid([]);
    for (const key of FEATURE_KEYS) {
      expect(grid[key]).toEqual({
        view: false,
        write: false,
        update: false,
        delete: false,
      });
    }
  });

  it("ignores a grant for an unknown featureKey defensively", () => {
    const permissions = [
      {
        featureKey: "billing" as unknown as PermissionGrant["featureKey"],
        view: true,
        write: false,
        update: false,
        delete: false,
      },
    ];
    expect(() => permissionsToGrid(permissions)).not.toThrow();
  });
});

describe("gridToPermissions", () => {
  it("round-trips a sparse permissions array through the grid and back", () => {
    const original: PermissionGrant[] = [
      { featureKey: "fisherfolk", view: true, write: true, update: false, delete: false },
      { featureKey: "vessels", view: true, write: false, update: false, delete: false },
    ];
    const grid = permissionsToGrid(original);
    const result = gridToPermissions(grid);
    const sortByFeature = (a: PermissionGrant, b: PermissionGrant) =>
      a.featureKey.localeCompare(b.featureKey);
    expect([...result].sort(sortByFeature)).toEqual(
      [...original].sort(sortByFeature),
    );
  });

  it("drops all-false rows so the output stays sparse", () => {
    const grid = buildEmptyGrid();
    expect(gridToPermissions(grid)).toEqual([]);
  });

  it("keeps a row with only one action checked", () => {
    const grid = buildEmptyGrid();
    grid.reports.view = true;
    expect(gridToPermissions(grid)).toEqual([
      { featureKey: "reports", view: true, write: false, update: false, delete: false },
    ]);
  });
});

describe("toggleCell / setRow / setColumn", () => {
  it("toggleCell flips exactly one cell without mutating the input", () => {
    const grid = buildEmptyGrid();
    const next = toggleCell(grid, "ayuda", "write", true);
    expect(grid.ayuda.write).toBe(false); // original untouched
    expect(next.ayuda.write).toBe(true);
    expect(next.ayuda.view).toBe(false);
  });

  it("setRow checks/unchecks every action for one feature", () => {
    const grid = buildEmptyGrid();
    const next = setRow(grid, "violations", true);
    expect(next.violations).toEqual({ view: true, write: true, update: true, delete: true });
    expect(next.vessels).toEqual({ view: false, write: false, update: false, delete: false });

    const cleared = setRow(next, "violations", false);
    expect(cleared.violations).toEqual({ view: false, write: false, update: false, delete: false });
  });

  it("setColumn checks/unchecks one action across every feature", () => {
    const grid = buildEmptyGrid();
    const next = setColumn(grid, "view", true);
    for (const key of FEATURE_KEYS) {
      expect(next[key].view).toBe(true);
      expect(next[key].write).toBe(false);
    }
  });
});

describe("validateRoleName", () => {
  it("rejects empty / whitespace-only names", () => {
    expect(validateRoleName("")).toBeTypeOf("string");
    expect(validateRoleName("   ")).toBeTypeOf("string");
  });

  it("rejects names over 60 characters", () => {
    expect(validateRoleName("a".repeat(61))).toBeTypeOf("string");
  });

  it("accepts a 1-60 character trimmed name", () => {
    expect(validateRoleName("Supervisor")).toBeNull();
    expect(validateRoleName("a".repeat(60))).toBeNull();
    expect(validateRoleName("  Field Coordinator  ")).toBeNull();
  });
});
