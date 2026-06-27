/**
 * dedup.ts — Pure deduplication + ID-collision library for FRMS bulk import.
 * No DB, no project imports. TypeScript strict + exactOptionalPropertyTypes.
 *
 * Rules (from PRODUCT.md §Deduplication & idempotency):
 *  - Dedup key = idNumber. Import is insert-only + idempotent.
 *  - Same idNumber + SAME person → keep the record with the MOST complete data.
 *  - Same idNumber + DIFFERENT person (identity fields contradict) → ID-COLLISION;
 *    must NOT be auto-merged; flagged for manual resolution.
 */

export type DedupRow = {
  idNumber: string;
  fullName?: string | null;
  dateOfBirth?: string | null; // YYYY-MM-DD or null
  sex?: string | null;
  barangay?: string | null;
  contactNumber?: string | null;
  rsbsaNumber?: string | null;
  photo?: string | null;
  signature?: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when a nullable/optional string has meaningful content after trim. */
function isPresent(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Normalise a name for collision comparison: lowercase + strip non-alphanumeric. */
function normaliseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Count of meaningful fields that are present and non-empty after trim.
 * Fields: fullName, dateOfBirth, sex, barangay, contactNumber,
 *         rsbsaNumber, photo, signature  (8 fields, max score = 8).
 */
export function completenessScore(row: DedupRow): number {
  let score = 0;
  if (isPresent(row.fullName)) score++;
  if (isPresent(row.dateOfBirth)) score++;
  if (isPresent(row.sex)) score++;
  if (isPresent(row.barangay)) score++;
  if (isPresent(row.contactNumber)) score++;
  if (isPresent(row.rsbsaNumber)) score++;
  if (isPresent(row.photo)) score++;
  if (isPresent(row.signature)) score++;
  return score;
}

/**
 * Return the row with the higher completenessScore.
 * Tie → return `a` (stable / first-seen wins).
 */
export function chooseMoreComplete(a: DedupRow, b: DedupRow): DedupRow {
  return completenessScore(b) > completenessScore(a) ? b : a;
}

/**
 * Determine whether two rows with the SAME idNumber represent DIFFERENT people.
 *
 * Returns true only when there is a positive contradiction:
 *   - BOTH rows have a non-empty fullName AND normalised names differ, OR
 *   - BOTH rows have a non-empty dateOfBirth AND trimmed values differ.
 *
 * Missing data is NOT a collision — only positive contradiction is.
 */
export function recordsCollide(a: DedupRow, b: DedupRow): boolean {
  if (isPresent(a.fullName) && isPresent(b.fullName)) {
    if (normaliseName(a.fullName) !== normaliseName(b.fullName)) {
      return true;
    }
  }
  if (isPresent(a.dateOfBirth) && isPresent(b.dateOfBirth)) {
    if (a.dateOfBirth.trim() !== b.dateOfBirth.trim()) {
      return true;
    }
  }
  return false;
}

export type DedupeResult = {
  /** One winner per idNumber (order mirrors first-seen occurrence). */
  kept: DedupRow[];
  /** All non-winning duplicates that were collapsed into a kept record. */
  duplicates: DedupRow[];
  /** Groups where two or more rows share an idNumber but contradict on identity. */
  collisions: Array<{ idNumber: string; rows: DedupRow[] }>;
};

/**
 * Full deduplication pass over an import batch.
 *
 * Algorithm:
 *  1. Group rows by idNumber, preserving first-seen order.
 *  2. For each group:
 *     - Size 1 → straight to `kept`.
 *     - Size > 1, any pair collides → entire group into `collisions`.
 *     - Size > 1, no collision → fold with `chooseMoreComplete`; winner → `kept`,
 *       losers → `duplicates`.
 */
export function dedupeInFile(rows: DedupRow[]): DedupeResult {
  // Build ordered map: idNumber → rows in encounter order.
  const groups = new Map<string, DedupRow[]>();
  for (const row of rows) {
    const existing = groups.get(row.idNumber);
    if (existing !== undefined) {
      existing.push(row);
    } else {
      groups.set(row.idNumber, [row]);
    }
  }

  const kept: DedupRow[] = [];
  const duplicates: DedupRow[] = [];
  const collisions: Array<{ idNumber: string; rows: DedupRow[] }> = [];

  for (const [idNumber, group] of groups) {
    // Single-row group — straight to kept.
    if (group.length === 1) {
      const first = group[0];
      if (!first) continue;
      kept.push(first);
      continue;
    }

    // Check all pairs for collision (O(n²) within a group — groups are tiny).
    let hasCollision = false;
    outer: for (let i = 0; i < group.length - 1; i++) {
      const rowI = group[i];
      if (!rowI) continue;
      for (let j = i + 1; j < group.length; j++) {
        const rowJ = group[j];
        if (!rowJ) continue;
        if (recordsCollide(rowI, rowJ)) {
          hasCollision = true;
          break outer;
        }
      }
    }

    if (hasCollision) {
      collisions.push({ idNumber, rows: group });
      continue;
    }

    // Same person — fold into the most complete record.
    const seed = group[0];
    if (!seed) continue;
    let winner: DedupRow = seed;
    const losers: DedupRow[] = [];
    for (const challenger of group.slice(1)) {
      const next = chooseMoreComplete(winner, challenger);
      if (next === winner) {
        losers.push(challenger);
      } else {
        losers.push(winner);
        winner = next;
      }
    }
    kept.push(winner);
    duplicates.push(...losers);
  }

  return { kept, duplicates, collisions };
}
