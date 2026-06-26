/**
 * validate.ts — Pure validation-report builder for FRMS bulk import.
 *
 * Zero side-effects: no DB, no FS, no network.
 * TypeScript strict + exactOptionalPropertyTypes + noUncheckedIndexedAccess.
 *
 * Call buildValidationReport() from the router (Step 1 dry-run / Step 4 confirm).
 * The router is responsible for fetching context (barangayList, typoMap,
 * existingIdNumbers) and supplying raw rows from the Excel parser.
 */

import { parseFullName } from "@/lib/normalize/name";
import {
  normalizeDob,
  normalizeSex,
  normalizeBarangay,
  normalizeContact,
  mapCategory,
} from "@/lib/normalize";
import { dedupeInFile, type DedupRow } from "@/lib/import/dedup";
import type { RawImportRow } from "@/lib/import/excel";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ValidationContext = {
  /** Canonical barangay names for this tenant (used by normalizeBarangay). */
  barangayList: string[];
  /** Typo corrections map passed to normalizeBarangay. */
  typoMap: Record<string, string>;
  /** idNumbers already stored in the DB for this tenant — used for idempotency. */
  existingIdNumbers: Set<string>;
};

export type RowAction =
  | "import"
  | "skip-existing"
  | "skip-duplicate"
  | "skip-collision";

export type RowStatus = "valid" | "warning" | "error";

export type RowReport = {
  /** 1-based position in the source file. */
  rowIndex: number;
  idNumber: string;
  normalized: {
    fullName: string;
    lastName: string;
    firstName: string;
    middleName: string | null;
    dateOfBirth: string | null;
    sex: "Male" | "Female" | null;
    barangay: string | null;
    /** Raw address string from the sheet (barangay is extracted separately). */
    address: string;
    contactNumber: string | null;
    rsbsaNumber: string | null;
    categories: string[];
    remarks: string | null;
  };
  status: RowStatus;
  action: RowAction;
  warnings: string[];
  errors: string[];
};

export type ValidationReport = {
  rows: RowReport[];
  /** One entry per idNumber that has a collision (2+ rows, different identity). */
  collisions: Array<{ idNumber: string; rows: number[] }>;
  counts: {
    total: number;
    valid: number;
    warning: number;
    error: number;
    /** Rows with action skip-duplicate. */
    duplicates: number;
    /** Number of collision groups (not rows). */
    collisions: number;
    /** Rows with action skip-existing. */
    existing: number;
    /** Rows that will be inserted (status !== error AND action === import). */
    toImport: number;
    toSkip: number;
  };
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Safe cell read: returns a trimmed string even when the key is absent.
 * Required because RawImportRow is Record<string,string> and
 * noUncheckedIndexedAccess makes indexed reads return string|undefined.
 */
function cell(raw: RawImportRow, key: string): string {
  return (raw[key] ?? "").trim();
}

/** Convert a trimmed string to null when it is empty. */
function nullIfEmpty(s: string): string | null {
  return s === "" ? null : s;
}

// ---------------------------------------------------------------------------
// Intermediate type — shared between Step 1 and Step 3
// ---------------------------------------------------------------------------

type PartialReport = {
  rowIndex: number;
  idNumber: string;
  normalized: RowReport["normalized"];
  /** Per-row warnings collected in normalisation pass. */
  warnings: string[];
  /** Per-row hard errors collected in normalisation pass. */
  errors: string[];
  /** Raw photo/signature strings for dedup (needed in Step 2). */
  photo: string | null;
  signature: string | null;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a full validation report for a raw import batch.
 *
 * Pure function: never throws on bad input, never touches external resources.
 * The caller (router) supplies all context.
 *
 * @param rawRows - Parsed rows from parseImportWorkbook().
 * @param ctx     - Tenant context: barangay list, typo map, existing IDs.
 */
export function buildValidationReport(
  rawRows: RawImportRow[],
  ctx: ValidationContext,
): ValidationReport {
  // ── Step 1: Per-row normalisation ─────────────────────────────────────────
  //
  // Run every normaliser, collect warnings for soft issues (dob, sex, etc.)
  // and errors for hard blockers (missing idNumber or name).
  // Does NOT touch dedup — that is step 2.

  const partial: PartialReport[] = rawRows.map((raw, i) => {
    const warnings: string[] = [];
    const errors: string[] = [];

    const idNumber = cell(raw, "idNumber");
    const rawFullName = cell(raw, "fullName");
    const rawAddress = cell(raw, "address");

    // Hard errors — block import regardless of dedup outcome
    if (!idNumber) errors.push("missing idNumber");
    if (!rawFullName) errors.push("missing name");

    // Name (always runs — even on empty string, parseFullName is safe)
    const parsed = parseFullName(rawFullName);

    // Date of birth
    const dobResult = normalizeDob(cell(raw, "dateOfBirth"));
    if (dobResult.warning !== undefined) warnings.push(dobResult.warning);

    // Sex
    const sexResult = normalizeSex(cell(raw, "sex"));
    if (sexResult.warning !== undefined) warnings.push(sexResult.warning);

    // Barangay (extracted from address)
    const barangayResult = normalizeBarangay(rawAddress, {
      typoMap: ctx.typoMap,
      validList: ctx.barangayList,
    });
    if (barangayResult.warning !== undefined)
      warnings.push(barangayResult.warning);

    // Contact
    const contactResult = normalizeContact(cell(raw, "contactNumber"));
    if (contactResult.warning !== undefined) warnings.push(contactResult.warning);

    // Category (multi-valued)
    const categoryResult = mapCategory(cell(raw, "category"));
    if (categoryResult.warning !== undefined) warnings.push(categoryResult.warning);

    return {
      rowIndex: i + 1,
      idNumber,
      normalized: {
        fullName: parsed.fullName,
        lastName: parsed.lastName,
        firstName: parsed.firstName,
        middleName: parsed.middleName,
        dateOfBirth: dobResult.value,
        sex: sexResult.value,
        barangay: barangayResult.value,
        address: rawAddress,
        contactNumber: contactResult.value,
        rsbsaNumber: nullIfEmpty(cell(raw, "rsbsaNumber")),
        categories: categoryResult.value ?? [],
        remarks: nullIfEmpty(cell(raw, "remarks")),
      },
      warnings,
      errors,
      photo: nullIfEmpty(cell(raw, "image")),
      signature: nullIfEmpty(cell(raw, "signature")),
    };
  });

  // ── Step 2: Build DedupRow[] for rows that have a non-empty idNumber ──────
  //
  // Rows with missing idNumber are already marked as errors; exclude them
  // from dedup so they do not create spurious collision/duplicate groups.

  const dedupRows: DedupRow[] = [];
  // Object-identity map: each DedupRow → its 0-based index in `partial`
  const dedupToPartialIdx = new Map<DedupRow, number>();

  for (let i = 0; i < partial.length; i++) {
    const p = partial[i];
    if (p === undefined || !p.idNumber) continue;

    const dr: DedupRow = {
      idNumber: p.idNumber,
      fullName: p.normalized.fullName || null,
      dateOfBirth: p.normalized.dateOfBirth,
      sex: p.normalized.sex,
      barangay: p.normalized.barangay,
      contactNumber: p.normalized.contactNumber,
      rsbsaNumber: p.normalized.rsbsaNumber,
      photo: p.photo,
      signature: p.signature,
    };
    dedupRows.push(dr);
    dedupToPartialIdx.set(dr, i);
  }

  // ── Step 3: Classify rows using dedup results ─────────────────────────────

  const dedupResult = dedupeInFile(dedupRows);

  // Per-index action overrides and extra messages injected by dedup
  const actionOverride = new Map<number, RowAction>();
  const extraWarnings = new Map<number, string[]>();
  const extraErrors = new Map<number, string[]>();

  // Collision groups — same idNumber, different identity → error + skip-collision
  const collisionReports: Array<{ idNumber: string; rows: number[] }> = [];

  for (const coll of dedupResult.collisions) {
    const rowNumbers: number[] = [];
    for (const dr of coll.rows) {
      const idx = dedupToPartialIdx.get(dr);
      if (idx === undefined) continue;
      actionOverride.set(idx, "skip-collision");
      const errs = extraErrors.get(idx) ?? [];
      errs.push(
        "ID conflict — same idNumber, different person (manual resolution)",
      );
      extraErrors.set(idx, errs);
      const p = partial[idx];
      if (p !== undefined) rowNumbers.push(p.rowIndex);
    }
    collisionReports.push({ idNumber: coll.idNumber, rows: rowNumbers });
  }

  // Duplicate losers — same person, same idNumber, but not the most-complete row
  for (const dr of dedupResult.duplicates) {
    const idx = dedupToPartialIdx.get(dr);
    if (idx === undefined) continue;
    actionOverride.set(idx, "skip-duplicate");
    const warns = extraWarnings.get(idx) ?? [];
    warns.push("duplicate idNumber in file — superseded by more complete row");
    extraWarnings.set(idx, warns);
  }

  // Kept winners whose idNumber already exists in the DB → idempotent skip
  for (const dr of dedupResult.kept) {
    const idx = dedupToPartialIdx.get(dr);
    if (idx === undefined) continue;
    if (ctx.existingIdNumbers.has(dr.idNumber)) {
      actionOverride.set(idx, "skip-existing");
      const warns = extraWarnings.get(idx) ?? [];
      warns.push("already imported (idempotent skip)");
      extraWarnings.set(idx, warns);
    }
  }

  // ── Step 4: Assemble final RowReport[] ───────────────────────────────────

  const rows: RowReport[] = partial.map((p, i) => {
    const addWarns = extraWarnings.get(i) ?? [];
    const addErrs = extraErrors.get(i) ?? [];
    const action: RowAction = actionOverride.get(i) ?? "import";
    const warnings = [...p.warnings, ...addWarns];
    const errors = [...p.errors, ...addErrs];

    const status: RowStatus =
      errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid";

    return {
      rowIndex: p.rowIndex,
      idNumber: p.idNumber,
      normalized: p.normalized,
      status,
      action,
      warnings,
      errors,
    };
  });

  // ── Step 5: Aggregate counts ──────────────────────────────────────────────

  let valid = 0;
  let warning = 0;
  let error = 0;
  let duplicates = 0;
  let existing = 0;
  let toImport = 0;
  let toSkip = 0;

  for (const row of rows) {
    if (row.status === "valid") valid++;
    else if (row.status === "warning") warning++;
    else error++;

    if (row.action === "skip-duplicate") duplicates++;
    if (row.action === "skip-existing") existing++;

    // A row is importable iff it has no hard errors AND is not skipped.
    if (row.status !== "error" && row.action === "import") toImport++;
    else toSkip++;
  }

  return {
    rows,
    collisions: collisionReports,
    counts: {
      total: rawRows.length,
      valid,
      warning,
      error,
      duplicates,
      collisions: collisionReports.length,
      existing,
      toImport,
      toSkip,
    },
  };
}
