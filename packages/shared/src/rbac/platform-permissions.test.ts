/**
 * hasPlatformPermission() resolver — PURE unit tests. No DB, no async, no
 * network. Milestone 2 of the Site Access & Tenancy Bootstrap Standard
 * (docs/SITE_ACCESS_STANDARD.md §2). Mirrors permissions.test.ts's structure
 * for the platform-tier resolver, plus the cross-scope anti-escalation
 * proofs this milestone specifically requires.
 */
import { describe, expect, it } from "vitest";

import { UserRole } from "../types/enums";
import type { PermissionMatrix } from "./permissions";
import {
  PLATFORM_PERMISSION_KEYS,
  type PlatformPermissionKey,
} from "./platform-permission-key";
import {
  PLATFORM_ADMIN_CEILING,
  hasPlatformPermission,
  intersectWithPlatformCeiling,
  type PlatformPermissionMatrix,
} from "./platform-permissions";
import { hasPermission } from "./permissions";
import { FEATURE_KEYS } from "./feature-key";

const ACTIONS = ["view", "write", "update", "delete"] as const;

describe("hasPlatformPermission — tenant_manager, no matrix (ADMIN default = full ceiling)", () => {
  for (const key of PLATFORM_PERMISSION_KEYS) {
    for (const action of ACTIONS) {
      it(`ADMIN (no platform role) can ${action} ${key}`, () => {
        expect(
          hasPlatformPermission({ role: UserRole.TENANT_MANAGER }, key, action),
        ).toBe(true);
      });
    }
  }

  it("PLATFORM_ADMIN_CEILING grants all four actions on every PlatformPermissionKey", () => {
    for (const key of PLATFORM_PERMISSION_KEYS) {
      expect(PLATFORM_ADMIN_CEILING[key]).toEqual({
        view: true,
        write: true,
        update: true,
        delete: true,
      });
    }
  });
});

describe("hasPlatformPermission — a curated BILLING role (matrix-driven, deny-by-default)", () => {
  const billingOnlyMatrix: PlatformPermissionMatrix = {
    billing: { view: true, write: true, update: true, delete: false },
  };

  it("grants the explicit billing row (view/write/update)", () => {
    expect(
      hasPlatformPermission(
        { role: UserRole.TENANT_MANAGER, matrix: billingOnlyMatrix },
        "billing",
        "view",
      ),
    ).toBe(true);
    expect(
      hasPlatformPermission(
        { role: UserRole.TENANT_MANAGER, matrix: billingOnlyMatrix },
        "billing",
        "write",
      ),
    ).toBe(true);
  });

  it("denies delete on billing (not granted)", () => {
    expect(
      hasPlatformPermission(
        { role: UserRole.TENANT_MANAGER, matrix: billingOnlyMatrix },
        "billing",
        "delete",
      ),
    ).toBe(false);
  });

  it("CANNOT resolve tenant_management — a BILLING-only role has no standing over tenant management", () => {
    for (const action of ACTIONS) {
      expect(
        hasPlatformPermission(
          { role: UserRole.TENANT_MANAGER, matrix: billingOnlyMatrix },
          "tenant_management",
          action,
        ),
      ).toBe(false);
    }
  });

  it("CANNOT resolve any other PlatformPermissionKey not present in the matrix (deny-by-default)", () => {
    const otherKeys: PlatformPermissionKey[] = PLATFORM_PERMISSION_KEYS.filter(
      (k) => k !== "billing",
    );
    for (const key of otherKeys) {
      for (const action of ACTIONS) {
        expect(
          hasPlatformPermission(
            { role: UserRole.TENANT_MANAGER, matrix: billingOnlyMatrix },
            key,
            action,
          ),
        ).toBe(false);
      }
    }
  });
});

describe("hasPlatformPermission — non-tenant_manager is NEVER a platform actor", () => {
  const nonPlatformRoles = [
    UserRole.TENANT_SUPERADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.ENCODER,
    UserRole.VIEWER,
    UserRole.BANTAY_DAGAT,
  ];

  for (const role of nonPlatformRoles) {
    for (const key of PLATFORM_PERMISSION_KEYS) {
      for (const action of ACTIONS) {
        it(`${role} denied ${action} ${key} — no matrix present`, () => {
          expect(hasPlatformPermission({ role }, key, action)).toBe(false);
        });
      }
    }
  }

  it("even with a (forged/bugged) matrix attached, a non-tenant_manager role is still denied everything", () => {
    const forgedFullMatrix: PlatformPermissionMatrix = {
      billing: { view: true, write: true, update: true, delete: true },
      tenant_management: { view: true, write: true, update: true, delete: true },
      data_overrides: { view: true, write: true, update: true, delete: true },
      tech_support: { view: true, write: true, update: true, delete: true },
    };
    for (const role of nonPlatformRoles) {
      for (const key of PLATFORM_PERMISSION_KEYS) {
        for (const action of ACTIONS) {
          expect(
            hasPlatformPermission({ role, matrix: forgedFullMatrix }, key, action),
          ).toBe(false);
        }
      }
    }
  });
});

describe("intersectWithPlatformCeiling — clamps a platform role's grant to the ADMIN ceiling", () => {
  it("passes through a grant already within the ceiling (ceiling is all-true)", () => {
    const grant: PlatformPermissionMatrix = {
      tech_support: { view: true, write: true, update: false, delete: false },
    };
    expect(intersectWithPlatformCeiling(grant)).toEqual(grant);
  });

  it("drops a key that is not a valid PlatformPermissionKey (a forged tenant FeatureKey)", () => {
    const grant = {
      tech_support: { view: true, write: false, update: false, delete: false },
      // Not a real PlatformPermissionKey — must never survive.
      fisherfolk: { view: true, write: true, update: true, delete: true },
    } as PlatformPermissionMatrix;
    const result = intersectWithPlatformCeiling(grant);
    expect(result).not.toHaveProperty("fisherfolk");
    expect(result.tech_support).toEqual({
      view: true,
      write: false,
      update: false,
      delete: false,
    });
  });

  it("is total over PlatformPermissionKey — every key is either present (from input) or absent", () => {
    const result = intersectWithPlatformCeiling({});
    expect(Object.keys(result)).toEqual([]);
  });

  it("is idempotent", () => {
    const grant: PlatformPermissionMatrix = {
      data_overrides: { view: true, write: true, update: true, delete: false },
    };
    const once = intersectWithPlatformCeiling(grant);
    const twice = intersectWithPlatformCeiling(once);
    expect(twice).toEqual(once);
  });
});

describe("Cross-scope anti-escalation — the two resolvers are code-disjoint", () => {
  it("PlatformPermissionKey and FeatureKey vocabularies do not overlap at all", () => {
    const overlap = PLATFORM_PERMISSION_KEYS.filter((k) =>
      (FEATURE_KEYS as readonly string[]).includes(k),
    );
    expect(overlap).toEqual([]);
  });

  it("a tenant custom role's PermissionMatrix (hasPermission) can never resolve a PlatformPermissionKey — the key is not a FeatureKey, so it can never even be looked up on that matrix's type", () => {
    // Structural proof: PLATFORM_PERMISSION_KEYS are not valid FeatureKey
    // values, so hasPermission() (whose matrix is keyed by FeatureKey) has
    // no code path that could ever accept one. We assert this at the value
    // level since TypeScript already enforces it at the type level.
    const tenantMatrix: PermissionMatrix = {
      fisherfolk: { view: true, write: true, update: true, delete: true },
    };
    for (const key of PLATFORM_PERMISSION_KEYS) {
      // @ts-expect-error — a PlatformPermissionKey is not a FeatureKey.
      expect(hasPermission({ role: UserRole.ENCODER, matrix: tenantMatrix }, key, "view")).toBe(
        false,
      );
    }
  });

  it("a platform role's PlatformPermissionMatrix (hasPlatformPermission) can never resolve a FeatureKey — the reverse structural proof", () => {
    const platformMatrix: PlatformPermissionMatrix = {
      billing: { view: true, write: true, update: true, delete: true },
    };
    for (const feature of FEATURE_KEYS) {
      // @ts-expect-error — a FeatureKey is not a PlatformPermissionKey.
      const result = hasPlatformPermission({ role: UserRole.TENANT_MANAGER, matrix: platformMatrix }, feature, "view");
      expect(result).toBe(false);
    }
  });
});
