/** Biological sex normalization for FRMS fisherfolk records. */

import type { NormResult, Sex } from "./types";

/**
 * Normalizes a raw sex/gender string to "Male" or "Female".
 * Decision is based on the first character (case-insensitive): m → Male, f → Female.
 * Anything else returns { value: null, warning }.
 */
export function normalizeSex(raw: string): NormResult<Sex> {
  const s = raw.trim();
  if (!s) return { value: null, warning: "empty sex field" };
  const first = s[0]!.toLowerCase();
  if (first === "m") return { value: "Male" };
  if (first === "f") return { value: "Female" };
  return { value: null, warning: `unrecognized sex: ${raw}` };
}
