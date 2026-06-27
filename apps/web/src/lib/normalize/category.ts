/** Fisherfolk registration category mapping for FRMS data import normalization. */

import type { CanonicalCategory, NormResult } from "./types";

/** Ordered keyword-to-category mapping. First match wins per segment. */
const KEYWORD_MAP: ReadonlyArray<readonly [string, CanonicalCategory]> = [
  ["boat owner", "Boat Owner/Operator"],
  ["capture fish", "Capture Fishing"],
  ["gleaner", "Gleaning"],
  ["gleaning", "Gleaning"],
  ["processing", "Fish Processing"],
  ["aquaculture", "Aquaculture"],
  ["vend", "Vendor"],
];

/**
 * Maps a raw category cell (may contain multiple categories) to an array of canonical categories.
 * Splits the input on commas, forward slashes, semicolons, and ampersands.
 * Uses lowercase substring matching; deduplicates results.
 * Returns { value: [], warning } when no keyword matches.
 */
export function mapCategory(raw: string): NormResult<CanonicalCategory[]> {
  const s = raw.trim();
  if (!s) return { value: [], warning: `no category matched: ${raw}` };

  // Split on delimiters: , / ; &
  const segments = s.split(/[,/;&]+/).map((seg) => seg.trim()).filter(Boolean);

  const seen = new Set<CanonicalCategory>();
  const results: CanonicalCategory[] = [];

  for (const segment of segments) {
    const lower = segment.toLowerCase();
    for (const [keyword, category] of KEYWORD_MAP) {
      if (lower.includes(keyword)) {
        if (!seen.has(category)) {
          seen.add(category);
          results.push(category);
        }
        break; // first match per segment
      }
    }
  }

  if (results.length === 0) {
    return { value: [], warning: `no category matched: ${raw}` };
  }

  return { value: results };
}
