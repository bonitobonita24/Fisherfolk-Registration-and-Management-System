/**
 * Full-name parsing for FRMS bulk import.
 *
 * Supports two source formats from the FMO dataset:
 *   • Comma form  — "LASTNAME, FIRSTNAME MIDDLENAME"
 *   • Plain form  — "FIRSTNAME MIDDLENAME LASTNAME"  (no comma)
 */

export interface ParsedFullName {
  lastName: string;
  firstName: string;
  middleName: string | null;
  fullName: string;
}

/** Title-case a string, capitalising the first letter of every word.
 *  Words joined by hyphens are handled per-segment (e.g. "Dela-Cruz"). */
function toTitleCase(s: string): string {
  return s
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) =>
          part.length === 0
            ? ""
            : part[0]!.toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join("-"),
    )
    .join(" ");
}

/**
 * Parse a raw name string into its constituent parts.
 *
 * Rules:
 *  - Trim + collapse internal whitespace first; `fullName` = cleaned original.
 *  - Comma present → before comma = lastName; remainder first token = firstName;
 *    any remaining tokens joined = middleName (null when none).
 *  - No comma:
 *      1 token  → firstName only, lastName = "", middleName = null
 *      2 tokens → firstName + lastName, middleName = null
 *      3+ tokens → first = firstName, last = lastName, middle = rest joined
 *  - All parts are title-cased; empty input returns empty strings / null.
 */
export function parseFullName(raw: string): ParsedFullName {
  const cleaned = raw.trim().replace(/\s+/g, " ");

  if (!cleaned) {
    return { lastName: "", firstName: "", middleName: null, fullName: "" };
  }

  const fullName = cleaned;

  if (cleaned.includes(",")) {
    // ── Comma form: "LASTNAME, FIRSTNAME MIDDLENAME" ──────────────────────
    const commaIdx = cleaned.indexOf(",");
    const rawLast = cleaned.slice(0, commaIdx).trim();
    const rest = cleaned.slice(commaIdx + 1).trim();
    const tokens = rest.length > 0 ? rest.split(" ") : [];

    const lastName = toTitleCase(rawLast);
    const firstName = tokens.length > 0 ? toTitleCase(tokens[0]!) : "";
    const middleName =
      tokens.length > 1 ? toTitleCase(tokens.slice(1).join(" ")) : null;

    return { lastName, firstName, middleName, fullName };
  }

  // ── No-comma form ─────────────────────────────────────────────────────────
  const tokens = cleaned.split(" ");

  if (tokens.length === 1) {
    return {
      lastName: "",
      firstName: toTitleCase(tokens[0]!),
      middleName: null,
      fullName,
    };
  }

  if (tokens.length === 2) {
    return {
      lastName: toTitleCase(tokens[1]!),
      firstName: toTitleCase(tokens[0]!),
      middleName: null,
      fullName,
    };
  }

  // 3+ tokens
  const firstName = toTitleCase(tokens[0]!);
  const lastName = toTitleCase(tokens[tokens.length - 1]!);
  const middleName = toTitleCase(tokens.slice(1, -1).join(" "));

  return { lastName, firstName, middleName, fullName };
}
