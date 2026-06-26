/**
 * Pure asset-matching utilities for bulk fisherfolk import.
 * No fs/network — safe to use in any environment.
 */

/**
 * Returns the basename of `filename` (after the last "/"), stripped of its
 * extension, lowercased, and trimmed of surrounding whitespace.
 *
 * Examples:
 *   "MR-CL-002660-2015.JPG"  → "mr-cl-002660-2015"
 *   "  PD-001.PNG  "          → "pd-001"
 */
export function assetKeyFromFilename(filename: string): string {
  const trimmed = filename.trim();
  const slashIdx = trimmed.lastIndexOf("/");
  const base = slashIdx !== -1 ? trimmed.slice(slashIdx + 1) : trimmed;
  const dotIdx = base.lastIndexOf(".");
  const stem = dotIdx !== -1 ? base.slice(0, dotIdx) : base;
  return stem.toLowerCase().trim();
}

export interface AssetMatch {
  /** idNumber (original case) → filename (original case) */
  matched: Map<string, string>;
  /** idNumbers that had no matching file, in input order */
  missing: string[];
  /** filenames whose key matched no idNumber, in input order */
  orphans: string[];
}

/**
 * Matches fisherfolk ID numbers against a list of asset filenames.
 *
 * Matching rule: `assetKeyFromFilename(file) === idNumber.toLowerCase().trim()`
 *
 * - `matched` preserves original case for both sides.
 * - `missing` and `orphans` follow input order.
 * - Deterministic: no sorting applied.
 */
export function matchAssets(
  idNumbers: string[],
  assetFilenames: string[],
): AssetMatch {
  // Build key → originalFilename lookup from the asset list.
  const filenameByKey = new Map<string, string>();
  for (const filename of assetFilenames) {
    const key = assetKeyFromFilename(filename);
    // First occurrence wins for duplicate keys.
    if (!filenameByKey.has(key)) {
      filenameByKey.set(key, filename);
    }
  }

  const matched = new Map<string, string>();
  const missing: string[] = [];
  const matchedFileKeys = new Set<string>();

  for (const idNumber of idNumbers) {
    const key = idNumber.toLowerCase().trim();
    const filename = filenameByKey.get(key);
    if (filename !== undefined) {
      matched.set(idNumber, filename);
      matchedFileKeys.add(key);
    } else {
      missing.push(idNumber);
    }
  }

  const orphans: string[] = [];
  for (const filename of assetFilenames) {
    const key = assetKeyFromFilename(filename);
    if (!matchedFileKeys.has(key)) {
      orphans.push(filename);
    }
  }

  return { matched, missing, orphans };
}

/**
 * Escapes a CSV field per RFC 4180:
 * wraps in double-quotes when the value contains commas, double-quotes,
 * or line-breaks, and doubles any internal double-quote characters.
 */
function escapeCsvField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Builds a RFC 4180 CSV report of records with missing assets.
 *
 * Header: `id_number,full_name,address,missing`
 */
export function buildMissingAssetsCsv(
  rows: Array<{
    idNumber: string;
    fullName?: string;
    address?: string;
    missing: "photo" | "signature" | "both";
  }>,
): string {
  const lines: string[] = ["id_number,full_name,address,missing"];

  for (const row of rows) {
    const id = escapeCsvField(row.idNumber);
    const name = escapeCsvField(row.fullName ?? "");
    const addr = escapeCsvField(row.address ?? "");
    const miss = escapeCsvField(row.missing);
    lines.push(`${id},${name},${addr},${miss}`);
  }

  return lines.join("\n");
}
