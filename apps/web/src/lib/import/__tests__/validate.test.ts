import { describe, it, expect } from "vitest";
import {
  buildValidationReport,
  type ValidationContext,
  type RowReport,
} from "@/lib/import/validate";
import type { RawImportRow } from "@/lib/import/excel";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DEFAULT_CTX: ValidationContext = {
  barangayList: ["Poblacion", "Barangay 2"],
  typoMap: {},
  existingIdNumbers: new Set<string>(),
};

/** Build a minimal valid RawImportRow with optional field overrides. */
function makeRow(overrides: Partial<Record<string, string>> = {}): RawImportRow {
  return {
    idNumber: "PD-001",
    fullName: "DELA CRUZ, JUAN ANTONIO",
    dateOfBirth: "01/15/1980",
    address: "Poblacion, Calapan City, Oriental Mindoro",
    sex: "M",
    image: "",
    signature: "",
    rsbsaNumber: "",
    category: "Capture Fishing",
    contactNumber: "09171234567",
    remarks: "",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pull a row from the report safely (no non-null assertion).
 * Returns undefined when the index is out of range — tests assert on the value.
 */
function getRow(rows: RowReport[], index: number): RowReport | undefined {
  return rows[index];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildValidationReport", () => {
  // ── 1. Clean valid row ────────────────────────────────────────────────────

  it("marks a fully-valid row as status:valid and action:import", () => {
    const { rows, counts } = buildValidationReport([makeRow()], DEFAULT_CTX);

    const row = getRow(rows, 0);
    expect(row?.status).toBe("valid");
    expect(row?.action).toBe("import");
    expect(row?.errors).toHaveLength(0);
    expect(row?.warnings).toHaveLength(0);
    expect(row?.rowIndex).toBe(1);
    expect(row?.idNumber).toBe("PD-001");

    // Normalised parts
    expect(row?.normalized.firstName).toBe("Juan");
    expect(row?.normalized.lastName).toBe("Dela Cruz");
    expect(row?.normalized.middleName).toBe("Antonio");
    expect(row?.normalized.sex).toBe("Male");
    expect(row?.normalized.dateOfBirth).toBe("1980-01-15");
    expect(row?.normalized.categories).toContain("Capture Fishing");

    // Importable
    expect(counts.toImport).toBe(1);
    expect(counts.toSkip).toBe(0);
  });

  // ── 2. Malformed dob → warning, still importable ─────────────────────────

  it("adds a warning for a malformed dob but keeps the row importable", () => {
    const raw = makeRow({ dateOfBirth: "not-a-date" });
    const { rows, counts } = buildValidationReport([raw], DEFAULT_CTX);

    const row = getRow(rows, 0);
    expect(row?.status).toBe("warning");
    expect(row?.action).toBe("import");
    expect(row?.errors).toHaveLength(0);
    expect(row?.warnings.length).toBeGreaterThan(0);
    expect(row?.normalized.dateOfBirth).toBeNull();

    // Still importable (warnings do not block)
    expect(counts.toImport).toBe(1);
    expect(counts.toSkip).toBe(0);
  });

  // ── 3. Missing idNumber → error, not importable ──────────────────────────

  it("errors on a missing idNumber and excludes the row from import", () => {
    const raw = makeRow({ idNumber: "" });
    const { rows, counts } = buildValidationReport([raw], DEFAULT_CTX);

    const row = getRow(rows, 0);
    expect(row?.status).toBe("error");
    expect(row?.errors).toContain("missing idNumber");

    // Not importable regardless of action value
    expect(counts.toImport).toBe(0);
    expect(counts.toSkip).toBe(1);
    expect(counts.error).toBe(1);
  });

  // ── 4. Duplicate idNumber (same person) → winner imports, loser skipped ──

  it("keeps the more-complete row and skips the sparse duplicate", () => {
    const sparse = makeRow({
      idNumber: "PD-002",
      dateOfBirth: "",
      contactNumber: "",
      rsbsaNumber: "",
      image: "",
      signature: "",
    });
    const complete = makeRow({
      idNumber: "PD-002",
      dateOfBirth: "03/20/1990",
      contactNumber: "09991234567",
      rsbsaNumber: "RSBSA-999",
      image: "photos/p.jpg",
      signature: "sigs/s.png",
    });

    const { rows, counts } = buildValidationReport(
      [sparse, complete],
      DEFAULT_CTX,
    );

    expect(rows).toHaveLength(2);

    const importRow = rows.find((r) => r.action === "import");
    const skipRow = rows.find((r) => r.action === "skip-duplicate");

    expect(importRow).toBeDefined();
    expect(skipRow).toBeDefined();

    // The winner must not be an error
    expect(importRow?.status).not.toBe("error");

    // Counts
    expect(counts.duplicates).toBe(1);
    expect(counts.toImport).toBe(1);
    expect(counts.toSkip).toBe(1);
    expect(counts.total).toBe(2);
    expect(counts.toImport + counts.toSkip).toBe(counts.total);
  });

  // ── 5. True collision (same id, different names) ──────────────────────────

  it("marks both collision rows as error/skip-collision and records one collisions entry", () => {
    const rowA = makeRow({ idNumber: "PD-003", fullName: "GARCIA, JOSE" });
    const rowB = makeRow({ idNumber: "PD-003", fullName: "SANTOS, MARIA" });

    const { rows, collisions, counts } = buildValidationReport(
      [rowA, rowB],
      DEFAULT_CTX,
    );

    expect(rows).toHaveLength(2);

    const colRowA = getRow(rows, 0);
    const colRowB = getRow(rows, 1);

    expect(colRowA?.status).toBe("error");
    expect(colRowA?.action).toBe("skip-collision");
    expect(colRowB?.status).toBe("error");
    expect(colRowB?.action).toBe("skip-collision");

    // One collision group
    expect(collisions).toHaveLength(1);
    expect(collisions[0]?.idNumber).toBe("PD-003");
    expect(collisions[0]?.rows).toContain(1); // rowIndex of rowA
    expect(collisions[0]?.rows).toContain(2); // rowIndex of rowB

    // Both are skipped
    expect(counts.toImport).toBe(0);
    expect(counts.toSkip).toBe(2);
    expect(counts.collisions).toBe(1);
    expect(counts.toImport + counts.toSkip).toBe(counts.total);
  });

  // ── 6. idNumber already in DB → skip-existing ────────────────────────────

  it("skips a row whose idNumber already exists in the DB (idempotent)", () => {
    const ctx: ValidationContext = {
      ...DEFAULT_CTX,
      existingIdNumbers: new Set(["PD-004"]),
    };
    const raw = makeRow({ idNumber: "PD-004" });
    const { rows, counts } = buildValidationReport([raw], ctx);

    const row = getRow(rows, 0);
    expect(row?.action).toBe("skip-existing");
    expect(row?.warnings).toContain("already imported (idempotent skip)");

    expect(counts.existing).toBe(1);
    expect(counts.toImport).toBe(0);
    expect(counts.toSkip).toBe(1);
  });

  // ── 7. Counts invariant: toImport + toSkip === total ─────────────────────

  it("maintains toImport + toSkip === total across a mixed batch", () => {
    const ctx: ValidationContext = {
      ...DEFAULT_CTX,
      existingIdNumbers: new Set(["PD-EXISTING"]),
    };

    const rows = [
      makeRow({ idNumber: "PD-VALID" }),                         // import
      makeRow({ idNumber: "", fullName: "NO ID ROW" }),           // error → skip
      makeRow({ idNumber: "PD-DUP", dateOfBirth: "" }),          // sparse dup → skip
      makeRow({ idNumber: "PD-DUP", dateOfBirth: "06/01/1985" }), // complete dup → import
      makeRow({ idNumber: "PD-EXISTING" }),                       // skip-existing
      makeRow({ idNumber: "PD-COLL-A", fullName: "REYES, JOSE" }),
      makeRow({ idNumber: "PD-COLL-A", fullName: "LOCO, MARIA" }), // collision pair
    ];

    const { counts } = buildValidationReport(rows, ctx);

    expect(counts.total).toBe(rows.length);
    expect(counts.toImport + counts.toSkip).toBe(counts.total);
    expect(counts.valid + counts.warning + counts.error).toBe(counts.total);
  });
});
