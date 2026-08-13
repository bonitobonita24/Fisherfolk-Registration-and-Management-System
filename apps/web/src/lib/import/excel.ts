/**
 * excel.ts — ExcelJS-based workbook parser for FRMS bulk import.
 *
 * Reads the first worksheet of an .xlsx buffer and returns canonically-keyed
 * rows plus any warnings about unmapped column headers.
 *
 * TypeScript strict + exactOptionalPropertyTypes + noUncheckedIndexedAccess.
 */

import ExcelJS from "exceljs";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A single data row from the import sheet; every value is a trimmed string. */
export type RawImportRow = Record<string, string>;

// ---------------------------------------------------------------------------
// Header mapping
// ---------------------------------------------------------------------------

/**
 * Normalise a raw header string before map lookup:
 *   trim → uppercase → collapse spaces → strip trailing # or .
 */
function normalizeRawHeader(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/[#.]$/, "")
    .trim();
}

/**
 * Canonical header → camelCase key table.
 * Keys must match the POST-normalisation form (see normalizeRawHeader).
 * e.g. "RSBSA #" → normalises to "RSBSA" → maps to "rsbsaNumber".
 */
const HEADER_MAP: Readonly<Record<string, string>> = {
  "ID NUMBER": "idNumber",
  "FULL NAME": "fullName",
  "DATE OF BIRTH": "dateOfBirth",
  ADDRESS: "address",
  SEX: "sex",
  IMAGE: "image",
  SIGNATURE: "signature",
  RSBSA: "rsbsaNumber",
  "RSBSA NUMBER": "rsbsaNumber",
  CATEGORY: "category",
  CATEGORIES: "category",
  "CONTACT NUMBER": "contactNumber",
  CONTACT: "contactNumber",
  REMARKS: "remarks",
};

/**
 * Return the canonical camelCase key for a raw header string,
 * or null when the header is not in the map.
 */
function mapHeader(raw: string): string | null {
  const normalized = normalizeRawHeader(raw);
  return HEADER_MAP[normalized] ?? null;
}

/**
 * Convert an unknown-header string to a safe slug key.
 * e.g. "SOME EXTRA COL" → "some_extra_col"
 */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^_+|_+$/g, "");
}

// ---------------------------------------------------------------------------
// Cell value coercion
// ---------------------------------------------------------------------------

/**
 * Coerce any ExcelJS cell value to a trimmed string.
 * Returns "" for null / undefined / error cells.
 */
export function cellValueToString(value: ExcelJS.CellValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "object") {
    // RichText — TypeScript narrows via `in`; no cast needed.
    if ("richText" in value) {
      return value.richText.map((r) => r.text).join("").trim();
    }

    // Hyperlink — text is string in exceljs d.ts.
    if ("hyperlink" in value) {
      return value.text.trim();
    }

    // Formula — result is number | string | boolean | Date | CellErrorValue | undefined.
    if ("formula" in value) {
      const result = value.result;
      if (result === undefined || result === null) return "";
      if (typeof result === "object" && "error" in result) return "";
      // After guards, result is number | string | boolean | Date — subset of CellValue.
      return cellValueToString(result);
    }

    // Shared formula.
    if ("sharedFormula" in value) {
      const result = value.result;
      if (result === undefined || result === null) return "";
      if (typeof result === "object" && "error" in result) return "";
      return cellValueToString(result);
    }

    // Error cell.
    if ("error" in value) return "";
  }

  return String(value).trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse the first worksheet of an .xlsx buffer into canonically-keyed rows.
 *
 * @param buffer - An ArrayBuffer or Node.js Buffer containing the .xlsx file.
 * @returns rows           — one object per non-empty data row; keys are canonical.
 *          headerWarnings — one message per unmapped column header.
 */
export async function parseImportWorkbook(
  buffer: ArrayBuffer | Buffer,
): Promise<{ rows: RawImportRow[]; headerWarnings: string[] }> {
  const workbook = new ExcelJS.Workbook();

  // ExcelJS xlsx.load() expects a Node Buffer.
  const buf =
    buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;

  // @ts-expect-error exceljs d.ts uses pre-TS5.7 unparameterized Buffer;
  // Buffer<ArrayBufferLike> is structurally compatible at runtime.
  await workbook.xlsx.load(buf);

  // Guard: workbook might be empty.
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { rows: [], headerWarnings: [] };
  }

  const rows: RawImportRow[] = [];
  const headerWarnings: string[] = [];
  // Resolved canonical key for each column index (0-based after slice(1)).
  const canonicalKeys: string[] = [];
  let isHeaderRow = true;

  worksheet.eachRow({ includeEmpty: false }, (row) => {
    // row.values is a 1-indexed sparse array; index 0 is always undefined.
    // Cast to include undefined so noUncheckedIndexedAccess stays clean.
    const rawValues = row.values as Array<ExcelJS.CellValue | undefined>;
    const cells = rawValues.slice(1); // drop unused index-0

    // ── First row = headers ──────────────────────────────────────────────
    if (isHeaderRow) {
      isHeaderRow = false;

      for (const cell of cells) {
        const rawText = cellValueToString(cell);
        const canonical = mapHeader(rawText);

        if (canonical !== null) {
          canonicalKeys.push(canonical);
        } else {
          // Unknown header — keep a slug and emit a warning.
          const slug = slugify(normalizeRawHeader(rawText)) || slugify(rawText) || "_unknown";
          if (rawText) {
            headerWarnings.push(`unmapped column: ${rawText}`);
          }
          canonicalKeys.push(slug);
        }
      }
      return;
    }

    // ── Data rows ────────────────────────────────────────────────────────
    const cellStrings = cells.map(cellValueToString);

    // Skip fully-empty rows.
    if (cellStrings.every((s) => s === "")) return;

    const rowObj: RawImportRow = {};
    canonicalKeys.forEach((key, i) => {
      // noUncheckedIndexedAccess: cellStrings[i] may be undefined; default "".
      rowObj[key] = cellStrings[i] ?? "";
    });
    rows.push(rowObj);
  });

  return { rows, headerWarnings };
}
