/**
 * Unit tests — dashboard.getYoYComparison
 *
 * Covers the pure merge/delta helper (buildYoYComparison) plus the procedure
 * wiring via a mocked ctx.db — no database required (runs in CI).
 */

import { describe, expect, it } from "vitest";
import type { Session } from "next-auth";

import type { TRPCContext } from "../context";
import { buildYoYComparison, dashboardRouter } from "./dashboard";
import { createCallerFactory } from "../trpc";

// ─── buildYoYComparison (pure) ───────────────────────────────────────────────

const newG = (registrationYear: number, count: number) => ({
  registrationYear,
  _count: { _all: count },
});
const renG = (renewalYear: number, count: number) => ({
  renewalYear,
  _count: { _all: count },
});

describe("buildYoYComparison", () => {
  it("merges new + renewal groups into an ascending per-year series", () => {
    const rows = buildYoYComparison(
      [newG(2025, 30), newG(2023, 10), newG(2024, 20)],
      [renG(2024, 5), renG(2025, 15)],
    );
    expect(rows.map((r) => r.year)).toEqual([2023, 2024, 2025]);
    expect(rows.map((r) => r.newCount)).toEqual([10, 20, 30]);
    expect(rows.map((r) => r.renewedCount)).toEqual([0, 5, 15]);
    expect(rows.map((r) => r.total)).toEqual([10, 25, 45]);
  });

  it("computes deltaPercent vs the prior year, rounded to 1 decimal", () => {
    const rows = buildYoYComparison(
      [newG(2024, 100), newG(2025, 112)],
      [],
    );
    expect(rows[0]?.deltaPercent).toBeNull(); // no 2023 data
    expect(rows[1]?.deltaPercent).toBe(12);

    const uneven = buildYoYComparison([newG(2024, 3), newG(2025, 4)], []);
    // (4-3)/3 = 33.333…% → 33.3
    expect(uneven[1]?.deltaPercent).toBe(33.3);
  });

  it("returns null deltaPercent when the prior year is absent or zero", () => {
    // Gap year: 2023 exists, 2025 exists, 2024 missing → 2025 has no prior.
    const gap = buildYoYComparison([newG(2023, 5), newG(2025, 8)], []);
    expect(gap.map((r) => r.deltaPercent)).toEqual([null, null]);

    // Prior year present but zero total → null (avoid divide-by-zero).
    const zero = buildYoYComparison(
      [newG(2024, 0), newG(2025, 8)],
      [],
    );
    expect(zero[1]?.deltaPercent).toBeNull();
  });

  it("handles negative deltas and years present in only one source", () => {
    const rows = buildYoYComparison(
      [newG(2024, 40)],
      [renG(2024, 10), renG(2025, 25)],
    );
    // 2024 total 50 → 2025 total 25 (renewals only) = -50%
    expect(rows[1]).toEqual({
      year: 2025,
      newCount: 0,
      renewedCount: 25,
      total: 25,
      deltaPercent: -50,
    });
  });

  it("returns an empty array for empty inputs", () => {
    expect(buildYoYComparison([], [])).toEqual([]);
  });
});

// ─── Procedure wiring (mocked db) ────────────────────────────────────────────

interface GroupByArgs {
  by: string[];
  where: Record<string, unknown>;
  _count: { _all: true };
  orderBy: Record<string, string>;
}

function makeCtx(db: unknown, tenantId: string | null): TRPCContext {
  return {
    session: {
      user: { id: "user-1", name: "Test Admin", email: "admin@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId: "user-1",
    role: "tenant_superadmin",
    tenantId,
    tenantSlug: "yoy-test",
    db: db as TRPCContext["db"],
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(dashboardRouter);

describe("dashboard.getYoYComparison (procedure)", () => {
  it("throws FORBIDDEN when no tenant is bound", async () => {
    const caller = callerFactory(makeCtx({}, null));
    await expect(caller.getYoYComparison()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("scopes both groupBy queries to the tenant and returns the merged series", async () => {
    const captured: { fisherfolk?: GroupByArgs; renewal?: GroupByArgs } = {};
    const db = {
      fisherfolk: {
        groupBy: (args: GroupByArgs) => {
          captured.fisherfolk = args;
          return Promise.resolve([newG(2024, 20), newG(2025, 22)]);
        },
      },
      registrationRenewal: {
        groupBy: (args: GroupByArgs) => {
          captured.renewal = args;
          return Promise.resolve([renG(2025, 3)]);
        },
      },
    };

    const caller = callerFactory(makeCtx(db, "tenant-yoy"));
    const rows = await caller.getYoYComparison();

    // Tenant scoping on both queries.
    expect(captured.fisherfolk?.where.tenantId).toBe("tenant-yoy");
    expect(captured.renewal?.where.tenantId).toBe("tenant-yoy");
    // Status convention mirrors the tile's "ALL" filter.
    expect(captured.fisherfolk?.where.status).toEqual({
      in: ["NEW", "RENEWED", "ACTIVE"],
    });
    expect(captured.fisherfolk?.by).toEqual(["registrationYear"]);
    expect(captured.renewal?.by).toEqual(["renewalYear"]);

    expect(rows).toEqual([
      {
        year: 2024,
        newCount: 20,
        renewedCount: 0,
        total: 20,
        deltaPercent: null,
      },
      {
        year: 2025,
        newCount: 22,
        renewedCount: 3,
        total: 25,
        deltaPercent: 25,
      },
    ]);
  });
});
