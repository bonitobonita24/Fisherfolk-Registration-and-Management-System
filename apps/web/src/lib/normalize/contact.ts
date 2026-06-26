/** Philippine mobile contact number normalization for FRMS fisherfolk records. */

import type { NormResult } from "./types";

/**
 * Normalizes a raw Philippine mobile number to canonical 11-digit format (09xxxxxxxxx).
 * Strips all non-digits, then applies conversion rules:
 *   - 10 digits starting with "9" → prepend "0" → 09xxxxxxxxx
 *   - 12 digits starting with "639" → replace "63" prefix with "0" → 09xxxxxxxxx
 *   - 11 digits starting with "09" → already canonical
 * Non-empty but non-conforming input is stored as-is with a warning (store-but-flag policy).
 * Empty input returns { value: null } with no warning.
 */
export function normalizeContact(raw: string): NormResult<string> {
  const stripped = raw.replace(/\D/g, "");
  if (!stripped) return { value: null };

  // 10 digits starting with 9 → prepend 0
  if (stripped.length === 10 && stripped.startsWith("9")) {
    return { value: `0${stripped}` };
  }

  // 12 digits starting with 639 → 0 + last 10 digits
  if (stripped.length === 12 && stripped.startsWith("639")) {
    return { value: `0${stripped.slice(2)}` };
  }

  // Already canonical: 11 digits starting with 09
  if (stripped.length === 11 && stripped.startsWith("09")) {
    return { value: stripped };
  }

  // Store-but-flag: non-conforming but not empty
  return {
    value: stripped,
    warning: `non-conforming PH mobile: ${raw}`,
  };
}
