/** Barangay name normalization for FRMS fisherfolk address fields. */

import type { BarangayOpts, NormResult } from "./types";

/** Set of lowercase Roman numeral words recognized as barangay suffixes/words. */
const ROMAN_WORD_SET = new Set([
  "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
]);

/** Map from arabic digit string (1–10) to Roman numeral, for trailing standalone tokens. */
const ARABIC_TO_ROMAN: Record<string, string> = {
  "1": "I", "2": "II", "3": "III", "4": "IV", "5": "V",
  "6": "VI", "7": "VII", "8": "VIII", "9": "IX", "10": "X",
};

/**
 * Title-cases a single hyphen-joined token (e.g. "nag-iba" → "Nag-Iba").
 * Each hyphen-separated segment is independently title-cased.
 */
function titleCaseToken(token: string): string {
  return token
    .split("-")
    .map((part) =>
      part.length === 0
        ? ""
        : part[0]!.toUpperCase() + part.slice(1).toLowerCase()
    )
    .join("-");
}

/**
 * Converts a single space-separated word from a barangay name to its canonical form:
 * - Roman numeral word (any case) → fully uppercase (e.g. "ii" → "II")
 * - Last word that is a standalone arabic digit 1-10 → Roman numeral (e.g. "1" → "I")
 * - Otherwise → Title Case (with hyphen-part support)
 */
function normalizeToken(token: string, isLast: boolean): string {
  const lower = token.toLowerCase();
  if (ROMAN_WORD_SET.has(lower)) return lower.toUpperCase();
  if (isLast) {
    const roman = ARABIC_TO_ROMAN[token];
    if (roman !== undefined) return roman;
  }
  return titleCaseToken(token);
}

/**
 * Normalizes a raw address string to a canonical barangay name.
 * Extracts text before the first comma, Title Cases each word, uppercases Roman numerals,
 * converts trailing arabic digit tokens (1-10) to Roman, applies typoMap, and validates
 * against validList. Returns { value: null, warning } for empty input.
 */
export function normalizeBarangay(
  rawAddress: string,
  opts?: BarangayOpts
): NormResult<string> {
  // Take text before the first comma and trim whitespace
  const segment = (rawAddress.split(",")[0] ?? "").trim();
  if (!segment) return { value: null, warning: "empty address" };

  // Split into tokens, normalize each
  const tokens = segment.split(/\s+/);
  const normalized = tokens
    .map((tok, idx) => normalizeToken(tok, idx === tokens.length - 1))
    .join(" ");

  // Apply typoMap (case-insensitive key lookup)
  let result = normalized;
  if (opts?.typoMap) {
    const normalizedLower = normalized.toLowerCase();
    for (const [key, replacement] of Object.entries(opts.typoMap)) {
      if (key.toLowerCase() === normalizedLower) {
        result = replacement;
        break;
      }
    }
  }

  // Validate against validList (case-insensitive)
  if (opts?.validList) {
    const resultLower = result.toLowerCase();
    const inList = opts.validList.some((v) => v.toLowerCase() === resultLower);
    if (!inList) {
      return { value: result, warning: `barangay not in tenant list: ${result}` };
    }
  }

  return { value: result };
}
