/** Date-of-birth normalization for FRMS fisherfolk records. */

import type { NormResult } from "./types";

/** Returns the number of days in the given month (1-indexed). Uses Date arithmetic; handles leap years. */
function daysInMonth(year: number, month: number): number {
  // day=0 of the NEXT month = last day of this month
  return new Date(year, month, 0).getDate();
}

/** Validates that month is 1-12 and day is valid for that month/year. */
function validateDate(
  year: number,
  month: number,
  day: number
): string | null {
  if (month < 1 || month > 12) return `invalid month ${month}`;
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay)
    return `invalid day ${day} for month ${month}/${year}`;
  return null;
}

/** Pads a number to at least 2 digits. */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Expands a 2-digit year using the heuristic: yy > 30 → 19yy, else → 20yy. */
function expandYear(yy: number): number {
  return yy > 30 ? 1900 + yy : 2000 + yy;
}

/**
 * Normalizes a raw date-of-birth string to canonical YYYY-MM-DD.
 * Accepts MM/DD/YYYY, M/D/YY, YYYY-MM-DD and common variants.
 * Never throws on bad input; returns { value: null, warning } for unrecoverable input.
 */
export function normalizeDob(raw: string): NormResult<string> {
  const s = raw.trim();
  if (!s) return { value: null, warning: "empty date of birth" };

  // Guard: 3-digit year pattern (e.g. "990-11-19") — explicit malformed check
  if (/^\d{3}-\d{1,2}-\d{1,2}$/.test(s)) {
    return { value: null, warning: `malformed date (3-digit year): ${s}` };
  }

  // Pattern 1: YYYY-MM-DD (strict ISO — 4-digit year)
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]!, 10);
    const month = parseInt(isoMatch[2]!, 10);
    const day = parseInt(isoMatch[3]!, 10);
    const err = validateDate(year, month, day);
    if (err) return { value: null, warning: `invalid date: ${err} in "${s}"` };
    return { value: `${year}-${pad2(month)}-${pad2(day)}` };
  }

  // Pattern 2: MM/DD/YYYY or M/D/YYYY (4-digit year)
  const mdyFull = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (mdyFull) {
    const month = parseInt(mdyFull[1]!, 10);
    const day = parseInt(mdyFull[2]!, 10);
    const year = parseInt(mdyFull[3]!, 10);
    const err = validateDate(year, month, day);
    if (err) return { value: null, warning: `invalid date: ${err} in "${s}"` };
    return { value: `${year}-${pad2(month)}-${pad2(day)}` };
  }

  // Pattern 3: MM/DD/YY or M/D/YY (2-digit year)
  const mdyShort = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(s);
  if (mdyShort) {
    const month = parseInt(mdyShort[1]!, 10);
    const day = parseInt(mdyShort[2]!, 10);
    const year = expandYear(parseInt(mdyShort[3]!, 10));
    const err = validateDate(year, month, day);
    if (err) return { value: null, warning: `invalid date: ${err} in "${s}"` };
    return { value: `${year}-${pad2(month)}-${pad2(day)}` };
  }

  return { value: null, warning: `unparseable date of birth: "${s}"` };
}
