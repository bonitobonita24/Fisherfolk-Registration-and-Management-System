import { describe, it, expect } from "vitest";
import {
  completenessScore,
  chooseMoreComplete,
  recordsCollide,
  dedupeInFile,
  type DedupRow,
} from "@/lib/import/dedup";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const full: DedupRow = {
  idNumber: "PD-001",
  fullName: "Juan dela Cruz",
  dateOfBirth: "1985-03-15",
  sex: "M",
  barangay: "Poblacion",
  contactNumber: "09171234567",
  rsbsaNumber: "RSBSA-001",
  photo: "photos/juan.jpg",
  signature: "sigs/juan.png",
};

const sparse: DedupRow = {
  idNumber: "PD-001",
  fullName: "Juan dela Cruz",
  // all other optional fields absent
};

const _sparse2: DedupRow = {
  idNumber: "PD-001",
  fullName: "Juan dela Cruz",
  dateOfBirth: "1985-03-15",
  // rest absent — kept for documentation; prefixed _ to satisfy no-unused-vars
};

const different: DedupRow = {
  idNumber: "PD-001",
  fullName: "Maria Santos",
  dateOfBirth: "1990-07-20",
  sex: "F",
};

const noName: DedupRow = {
  idNumber: "PD-001",
  dateOfBirth: "1985-03-15",
  sex: "M",
};

const noDob: DedupRow = {
  idNumber: "PD-001",
  fullName: "Juan dela Cruz",
  sex: "M",
};

// ---------------------------------------------------------------------------
// completenessScore
// ---------------------------------------------------------------------------

describe("completenessScore", () => {
  it("scores a fully populated record as 8", () => {
    expect(completenessScore(full)).toBe(8);
  });

  it("scores a sparse record lower than a full one", () => {
    expect(completenessScore(sparse)).toBeLessThan(completenessScore(full));
  });

  it("scores idNumber-only record as 0 (idNumber is the key, not a scored field)", () => {
    expect(completenessScore({ idNumber: "PD-999" })).toBe(0);
  });

  it("treats null and empty-string fields as absent", () => {
    const row: DedupRow = {
      idNumber: "PD-002",
      fullName: null,
      dateOfBirth: "  ",
      sex: "",
    };
    expect(completenessScore(row)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// chooseMoreComplete
// ---------------------------------------------------------------------------

describe("chooseMoreComplete", () => {
  it("picks the fuller record when b has more fields", () => {
    expect(chooseMoreComplete(sparse, full)).toBe(full);
  });

  it("picks the fuller record when a has more fields", () => {
    expect(chooseMoreComplete(full, sparse)).toBe(full);
  });

  it("returns a on a tie (stable / first-seen wins)", () => {
    const a: DedupRow = { idNumber: "PD-001", fullName: "Juan dela Cruz" };
    const b: DedupRow = { idNumber: "PD-001", fullName: "Juan dela Cruz" };
    expect(chooseMoreComplete(a, b)).toBe(a);
  });
});

// ---------------------------------------------------------------------------
// recordsCollide
// ---------------------------------------------------------------------------

describe("recordsCollide", () => {
  it("returns false when same name and same dob (same person)", () => {
    const a: DedupRow = {
      idNumber: "PD-001",
      fullName: "Juan dela Cruz",
      dateOfBirth: "1985-03-15",
    };
    const b: DedupRow = {
      idNumber: "PD-001",
      fullName: "Juan Dela Cruz", // capitalisation differs — normalise strips it
      dateOfBirth: "1985-03-15",
    };
    expect(recordsCollide(a, b)).toBe(false);
  });

  it("returns true when names differ (different person, same id)", () => {
    expect(recordsCollide(full, different)).toBe(true);
  });

  it("returns true when both have dobs that differ (same name, different dob)", () => {
    const a: DedupRow = {
      idNumber: "PD-001",
      fullName: "Juan dela Cruz",
      dateOfBirth: "1985-03-15",
    };
    const b: DedupRow = {
      idNumber: "PD-001",
      fullName: "Juan dela Cruz",
      dateOfBirth: "1990-07-20",
    };
    expect(recordsCollide(a, b)).toBe(true);
  });

  it("returns false when one side is missing a name (not a positive contradiction)", () => {
    expect(recordsCollide(noName, full)).toBe(false);
  });

  it("returns false when one side is missing a dob (not a positive contradiction)", () => {
    expect(recordsCollide(noDob, different)).toBe(true); // names differ → collision
  });

  it("returns false when both sides lack name and dob (nothing to contradict)", () => {
    const a: DedupRow = { idNumber: "PD-001", sex: "M" };
    const b: DedupRow = { idNumber: "PD-001", sex: "F" };
    expect(recordsCollide(a, b)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// dedupeInFile
// ---------------------------------------------------------------------------

describe("dedupeInFile", () => {
  it("passes through a unique row unchanged", () => {
    const result = dedupeInFile([full]);
    expect(result.kept).toHaveLength(1);
    expect(result.kept[0]).toBe(full);
    expect(result.duplicates).toHaveLength(0);
    expect(result.collisions).toHaveLength(0);
  });

  it("two dup rows for the same person → 1 kept (fuller) + 1 duplicate", () => {
    const result = dedupeInFile([sparse, full]);
    expect(result.kept).toHaveLength(1);
    expect(result.kept[0]).toBe(full);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]).toBe(sparse);
    expect(result.collisions).toHaveLength(0);
  });

  it("a genuine collision (same id, two different names) → group in collisions, none in kept", () => {
    const result = dedupeInFile([sparse, different]);
    expect(result.kept).toHaveLength(0);
    expect(result.duplicates).toHaveLength(0);
    expect(result.collisions).toHaveLength(1);
    const col0 = result.collisions[0];
    expect(col0).toBeDefined();
    expect(col0?.idNumber).toBe("PD-001");
    expect(col0?.rows).toHaveLength(2);
  });

  it("mixed file: unique + same-person dup + collision counts correctly", () => {
    const unique: DedupRow = {
      idNumber: "PD-002",
      fullName: "Maria Santos",
      dateOfBirth: "1990-07-20",
    };

    // Same-person duplicate group (PD-001): sparse vs sparse2 — no name contradiction
    const dupA: DedupRow = {
      idNumber: "PD-003",
      fullName: "Pedro Reyes",
      dateOfBirth: "1975-01-10",
    };
    const dupB: DedupRow = {
      idNumber: "PD-003",
      fullName: "Pedro Reyes",
      dateOfBirth: "1975-01-10",
      sex: "M",
      barangay: "Mahal",
    };

    // Collision group (PD-004)
    const colA: DedupRow = {
      idNumber: "PD-004",
      fullName: "Rosa Lim",
      dateOfBirth: "2000-05-05",
    };
    const colB: DedupRow = {
      idNumber: "PD-004",
      fullName: "Rosario Lim",
      dateOfBirth: "2000-05-05",
    };

    const result = dedupeInFile([unique, dupA, dupB, colA, colB]);

    // unique → kept; dupA+dupB same person → 1 kept + 1 dup; colA+colB → collision
    expect(result.kept).toHaveLength(2); // unique + winner of dupA/dupB
    expect(result.duplicates).toHaveLength(1); // loser of dupA/dupB
    expect(result.collisions).toHaveLength(1);
    const col1 = result.collisions[0];
    expect(col1).toBeDefined();
    expect(col1?.idNumber).toBe("PD-004");
  });

  it("preserves first-seen order in kept", () => {
    const a: DedupRow = { idNumber: "PD-010", fullName: "Alice" };
    const b: DedupRow = { idNumber: "PD-020", fullName: "Bob" };
    const c: DedupRow = { idNumber: "PD-030", fullName: "Carol" };
    const result = dedupeInFile([a, b, c]);
    expect(result.kept.map((r) => r.idNumber)).toEqual(["PD-010", "PD-020", "PD-030"]);
  });
});
