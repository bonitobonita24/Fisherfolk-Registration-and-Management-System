/** Shared types and constants for the FRMS normalization library. */

/** Result envelope: value is null when input is unrecoverable; warning is set when caller should be alerted. */
export type NormResult<T> = { value: T | null; warning?: string };

/** Canonical biological sex values used throughout FRMS. */
export type Sex = "Male" | "Female";

/** Options for barangay normalization. */
export type BarangayOpts = { typoMap?: Record<string, string>; validList?: string[] };

/** Ordered list of canonical fisherfolk registration categories. */
export const CANONICAL_CATEGORIES = [
  "Boat Owner/Operator",
  "Capture Fishing",
  "Gleaning",
  "Vendor",
  "Fish Processing",
  "Aquaculture",
] as const;

/** Union of all valid canonical category strings. */
export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];
