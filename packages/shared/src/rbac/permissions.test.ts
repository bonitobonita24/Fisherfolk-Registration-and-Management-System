/**
 * hasPermission() resolver — PURE unit tests. No DB, no async, no network.
 * See ~/.claude/rules/tenant-rbac-standard.md §4 for the spec this
 * implements (STRICT-CRUD matrix, deny-by-default, tenant_admin ceiling).
 */
import { describe, expect, it } from "vitest";

import { UserRole } from "../types/enums";
import { FEATURE_KEYS, type FeatureKey } from "./feature-key";
import {
  DOMAIN_ROLE_PRESETS,
  TENANT_ADMIN_CEILING,
  hasPermission,
  intersectWithCeiling,
  type PermissionAction,
  type PermissionMatrix,
} from "./permissions";

const ACTIONS: PermissionAction[] = ["view", "write", "update", "delete"];

describe("hasPermission — tenant_manager and tenant_superadmin (platform/owner ceiling)", () => {
  for (const role of [UserRole.TENANT_MANAGER, UserRole.TENANT_SUPERADMIN]) {
    for (const feature of FEATURE_KEYS) {
      for (const action of ACTIONS) {
        it(`${role} can ${action} ${feature}`, () => {
          expect(hasPermission({ role }, feature, action)).toBe(true);
        });
      }
    }
  }
});

describe("hasPermission — tenant_admin is the ceiling for every custom role", () => {
  for (const feature of FEATURE_KEYS) {
    for (const action of ACTIONS) {
      it(`tenant_admin can ${action} ${feature}`, () => {
        expect(
          hasPermission({ role: UserRole.TENANT_ADMIN }, feature, action),
        ).toBe(true);
      });
    }
  }

  it("billing and user_management are structurally unreachable — not valid FeatureKey values", () => {
    // FeatureKey (packages/db/prisma/schema.prisma) deliberately excludes
    // these — TypeScript rejects them at compile time, so there is no
    // runtime path (matrix key, preset key, or ceiling key) that can ever
    // grant them. Assert the type-level exclusion held at the value level.
    expect(FEATURE_KEYS).not.toContain("billing");
    expect(FEATURE_KEYS).not.toContain("user_management");
    expect(Object.keys(TENANT_ADMIN_CEILING)).not.toContain("billing");
    expect(Object.keys(TENANT_ADMIN_CEILING)).not.toContain(
      "user_management",
    );
  });

  it("TENANT_ADMIN_CEILING grants all four actions on every FeatureKey (total ceiling)", () => {
    for (const feature of FEATURE_KEYS) {
      expect(TENANT_ADMIN_CEILING[feature]).toEqual({
        view: true,
        write: true,
        update: true,
        delete: true,
      });
    }
  });
});

describe("hasPermission — viewer preset (read-only on every feature)", () => {
  for (const feature of FEATURE_KEYS) {
    it(`viewer can view ${feature}`, () => {
      expect(hasPermission({ role: UserRole.VIEWER }, feature, "view")).toBe(
        true,
      );
    });

    for (const action of ["write", "update", "delete"] as const) {
      it(`viewer cannot ${action} ${feature}`, () => {
        expect(
          hasPermission({ role: UserRole.VIEWER }, feature, action),
        ).toBe(false);
      });
    }
  }
});

/**
 * encoder ≈ Operator preset: write+update (create/edit, no delete) on the
 * operational features encoders own in FRMS (data-entry surfaces), view
 * elsewhere is NOT granted by this mapping — mirrors the app's existing
 * nav-items.ts role gates (apps/web/src/components/nav-items.ts), where
 * `encoder` is absent from Ayuda / Violations / Analytics / Map / Reports /
 * Data Import / Audit Log. See permissions.ts DOMAIN_ROLE_PRESETS.encoder
 * for the exact feature list + rationale.
 */
describe("hasPermission — encoder preset (Operator shape)", () => {
  const OWNED: FeatureKey[] = [
    "fisherfolk",
    "households",
    "vessels",
    "fish_catches",
    "edit_requests",
    "kanban",
    "id_generator",
    "notifications",
  ];
  const NOT_OWNED = FEATURE_KEYS.filter(
    (f) => !OWNED.includes(f),
  );

  for (const feature of OWNED) {
    it(`encoder can view+write+update (not delete) ${feature}`, () => {
      expect(hasPermission({ role: UserRole.ENCODER }, feature, "view")).toBe(
        true,
      );
      expect(
        hasPermission({ role: UserRole.ENCODER }, feature, "write"),
      ).toBe(true);
      expect(
        hasPermission({ role: UserRole.ENCODER }, feature, "update"),
      ).toBe(true);
      expect(
        hasPermission({ role: UserRole.ENCODER }, feature, "delete"),
      ).toBe(false);
    });
  }

  for (const feature of NOT_OWNED) {
    for (const action of ACTIONS) {
      it(`encoder cannot ${action} ${feature} (not an owned operational feature)`, () => {
        expect(
          hasPermission({ role: UserRole.ENCODER }, feature, action),
        ).toBe(false);
      });
    }
  }
});

/**
 * bantay_dagat ≈ fisheries-enforcement operational shape (Supervisor-like):
 * write+update on violations (their core enforcement duty — filing/lifting
 * violations), view-only on fisherfolk/vessels/fish_catches (identification
 * during enforcement), nothing else. See permissions.ts
 * DOMAIN_ROLE_PRESETS.bantay_dagat for rationale.
 */
describe("hasPermission — bantay_dagat preset (fisheries-enforcement shape)", () => {
  it("bantay_dagat can view+write+update (not delete) violations", () => {
    expect(
      hasPermission({ role: UserRole.BANTAY_DAGAT }, "violations", "view"),
    ).toBe(true);
    expect(
      hasPermission({ role: UserRole.BANTAY_DAGAT }, "violations", "write"),
    ).toBe(true);
    expect(
      hasPermission({ role: UserRole.BANTAY_DAGAT }, "violations", "update"),
    ).toBe(true);
    expect(
      hasPermission({ role: UserRole.BANTAY_DAGAT }, "violations", "delete"),
    ).toBe(false);
  });

  for (const feature of ["fisherfolk", "vessels", "fish_catches"] as const) {
    it(`bantay_dagat can view (only) ${feature}`, () => {
      expect(
        hasPermission({ role: UserRole.BANTAY_DAGAT }, feature, "view"),
      ).toBe(true);
      for (const action of ["write", "update", "delete"] as const) {
        expect(
          hasPermission({ role: UserRole.BANTAY_DAGAT }, feature, action),
        ).toBe(false);
      }
    });
  }

  const UNGRANTED = FEATURE_KEYS.filter(
    (f) => !["violations", "fisherfolk", "vessels", "fish_catches"].includes(f),
  );
  for (const feature of UNGRANTED) {
    for (const action of ACTIONS) {
      it(`bantay_dagat cannot ${action} ${feature}`, () => {
        expect(
          hasPermission({ role: UserRole.BANTAY_DAGAT }, feature, action),
        ).toBe(false);
      });
    }
  }
});

describe("hasPermission — custom-role actor (matrix-driven, deny-by-default)", () => {
  // A custom role built by a tenant_superadmin: explicit grant on exactly
  // one feature/action pair. Everything else must resolve to false even
  // though the base UserRole here is `encoder` — presence of a `matrix`
  // means matrix-driven resolution takes over from the fixed preset
  // (see permissions.ts hasPermission dispatch order).
  const matrix: PermissionMatrix = {
    reports: { view: true, write: false, update: false, delete: false },
  };

  it("grants the explicit matrix row", () => {
    expect(
      hasPermission({ role: UserRole.ENCODER, matrix }, "reports", "view"),
    ).toBe(true);
  });

  it("denies actions on the explicit row not set to true", () => {
    expect(
      hasPermission({ role: UserRole.ENCODER, matrix }, "reports", "write"),
    ).toBe(false);
  });

  it("denies every action on a feature with no matrix row at all (deny-by-default)", () => {
    for (const feature of FEATURE_KEYS.filter((f) => f !== "reports")) {
      for (const action of ACTIONS) {
        expect(
          hasPermission({ role: UserRole.ENCODER, matrix }, feature, action),
        ).toBe(false);
      }
    }
  });

  it("a matrix actor is NOT granted the encoder preset's normal owned-feature access", () => {
    // Sanity: without a matrix, encoder can write fisherfolk (see preset
    // test above). With an explicit (but unrelated) matrix present, that
    // implicit preset grant must NOT leak through.
    expect(
      hasPermission(
        { role: UserRole.ENCODER, matrix },
        "fisherfolk",
        "write",
      ),
    ).toBe(false);
  });
});

describe("intersectWithCeiling — clamps a custom-role grant to the tenant_admin ceiling", () => {
  it("passes through a grant that is already within the ceiling (ceiling is all-true)", () => {
    const grant: PermissionMatrix = {
      fisherfolk: { view: true, write: true, update: false, delete: false },
    };
    expect(intersectWithCeiling(grant)).toEqual(grant);
  });

  it("drops a key that is not a valid FeatureKey (forbidden/unknown feature)", () => {
    const grant = {
      fisherfolk: { view: true, write: false, update: false, delete: false },
      // Not a real FeatureKey — must never survive into the resolved matrix.
      billing: { view: true, write: true, update: true, delete: true },
    } as PermissionMatrix;
    const result = intersectWithCeiling(grant);
    expect(result).not.toHaveProperty("billing");
    expect(result.fisherfolk).toEqual({
      view: true,
      write: false,
      update: false,
      delete: false,
    });
  });

  it("is total over FeatureKey — every key is either present (from input) or absent", () => {
    const result = intersectWithCeiling({});
    expect(Object.keys(result)).toEqual([]);
  });

  it("is idempotent — applying it twice yields the same result", () => {
    const grant: PermissionMatrix = {
      violations: { view: true, write: true, update: true, delete: false },
      ayuda: { view: true, write: false, update: false, delete: false },
    };
    const once = intersectWithCeiling(grant);
    const twice = intersectWithCeiling(once);
    expect(twice).toEqual(once);
  });
});

describe("DOMAIN_ROLE_PRESETS — structural sanity", () => {
  it("only defines the three fixed domain roles (encoder, viewer, bantay_dagat)", () => {
    expect(Object.keys(DOMAIN_ROLE_PRESETS).sort()).toEqual([
      "bantay_dagat",
      "encoder",
      "viewer",
    ]);
  });

  it("no preset ever exceeds the tenant_admin ceiling on any feature/action", () => {
    for (const preset of Object.values(DOMAIN_ROLE_PRESETS)) {
      for (const feature of FEATURE_KEYS) {
        const grant = preset[feature];
        if (!grant) continue;
        const ceiling = TENANT_ADMIN_CEILING[feature];
        for (const action of ACTIONS) {
          if (grant[action]) {
            expect(ceiling[action]).toBe(true);
          }
        }
      }
    }
  });
});
