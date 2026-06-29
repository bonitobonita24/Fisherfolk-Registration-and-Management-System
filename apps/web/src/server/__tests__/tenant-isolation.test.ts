import { describe, expect, it } from "vitest";

import {
  assertTenantContext,
  isSystemModel,
  scopeArgsToTenant,
} from "@frms/db";

/**
 * Multi-tenant isolation contract.
 *
 * Data isolation in this app is enforced by the Prisma `tenantGuardExtension`,
 * whose pure core (`scopeArgsToTenant` / `assertTenantContext` / `isSystemModel`)
 * is exercised here WITHOUT a database. These tests assert the security
 * guarantees that keep one LGU tenant's records invisible to another:
 *
 *   - every guarded query is scoped to the active tenant
 *   - a forged `where.tenantId` CANNOT read across tenants (override wins)
 *   - writes are stamped with the active tenant
 *   - guarded queries refuse to run with no tenant context
 *
 * If any of these regress, cross-tenant data leakage becomes possible — which
 * for a gov/LGU app is a Data Privacy Act (RA 10173) incident. Keep this green.
 */

const TENANT_A = "tenant-aaaa";
const TENANT_B = "tenant-bbbb";

describe("tenant isolation — read scoping", () => {
  it("injects tenantId into a where-less findMany", () => {
    const args = scopeArgsToTenant("findMany", {}, TENANT_A);
    expect(args.where).toEqual({ tenantId: TENANT_A });
  });

  it("preserves caller filters while forcing the active tenantId", () => {
    const args = scopeArgsToTenant(
      "findMany",
      { where: { status: "active", barangay: "Lazareto" } },
      TENANT_A,
    );
    expect(args.where).toEqual({
      status: "active",
      barangay: "Lazareto",
      tenantId: TENANT_A,
    });
  });

  it("scopes findFirst / count / aggregate / groupBy with no where", () => {
    for (const op of ["findFirst", "count", "aggregate", "groupBy"]) {
      const args = scopeArgsToTenant(op, {}, TENANT_A);
      expect(args.where).toEqual({ tenantId: TENANT_A });
    }
  });
});

describe("tenant isolation — the cross-tenant attack is blocked", () => {
  it("OVERRIDES a forged where.tenantId (cannot read another tenant)", () => {
    // Caller (in tenant A's context) tries to read tenant B's rows.
    const args = scopeArgsToTenant(
      "findMany",
      { where: { tenantId: TENANT_B } },
      TENANT_A,
    );
    // The active tenant always wins — B is unreachable.
    expect((args.where as { tenantId: string }).tenantId).toBe(TENANT_A);
  });

  it("two tenant contexts produce disjoint scoping for the same query", () => {
    const a = scopeArgsToTenant("findMany", { where: { status: "active" } }, TENANT_A);
    const b = scopeArgsToTenant("findMany", { where: { status: "active" } }, TENANT_B);
    expect((a.where as { tenantId: string }).tenantId).toBe(TENANT_A);
    expect((b.where as { tenantId: string }).tenantId).toBe(TENANT_B);
    expect((a.where as { tenantId: string }).tenantId).not.toBe(
      (b.where as { tenantId: string }).tenantId,
    );
  });
});

describe("tenant isolation — write stamping", () => {
  it("stamps tenantId onto a single create payload", () => {
    const args = scopeArgsToTenant(
      "create",
      { data: { idNumber: "MR-CL-000001-2026", firstName: "Juan" } },
      TENANT_A,
    );
    expect((args.data as { tenantId: string }).tenantId).toBe(TENANT_A);
  });

  it("overrides a forged tenantId in a create payload", () => {
    const args = scopeArgsToTenant(
      "create",
      { data: { firstName: "Juan", tenantId: TENANT_B } },
      TENANT_A,
    );
    expect((args.data as { tenantId: string }).tenantId).toBe(TENANT_A);
  });

  it("stamps every item of a createMany array", () => {
    const args = scopeArgsToTenant(
      "createMany",
      { data: [{ firstName: "A" }, { firstName: "B", tenantId: TENANT_B }] },
      TENANT_A,
    );
    for (const item of args.data as Array<{ tenantId: string }>) {
      expect(item.tenantId).toBe(TENANT_A);
    }
  });

  it("scopes updateMany / deleteMany even with no where", () => {
    for (const op of ["updateMany", "deleteMany"]) {
      const args = scopeArgsToTenant(op, {}, TENANT_A);
      expect(args.where).toEqual({ tenantId: TENANT_A });
    }
  });
});

describe("tenant isolation — context + system models", () => {
  it("refuses to run a guarded query with no tenant context", () => {
    expect(() =>
      assertTenantContext(undefined, "Fisherfolk", "findMany"),
    ).toThrowError(/Tenant context not set/);
  });

  it("allows a guarded query when context is present", () => {
    expect(() =>
      assertTenantContext(TENANT_A, "Fisherfolk", "findMany"),
    ).not.toThrow();
  });

  it("treats Tenant and AuditLog as system (un-scoped) models", () => {
    expect(isSystemModel("Tenant")).toBe(true);
    expect(isSystemModel("AuditLog")).toBe(true);
  });

  it("treats business models as tenant-scoped", () => {
    for (const m of ["Fisherfolk", "Vessel", "Violation", "Ayuda", "User"]) {
      expect(isSystemModel(m)).toBe(false);
    }
  });
});
