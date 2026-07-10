/**
 * Guardrail: FEATURE_KEYS (mirrored, zero-DB-import) must stay in lockstep
 * with the source-of-truth `enum FeatureKey` in
 * packages/db/prisma/schema.prisma. Parses the schema text directly (no
 * DATABASE_URL / Prisma client needed) — same static-read technique as
 * packages/db/src/__tests__/custom-role-schema.test.ts.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { FEATURE_KEYS } from "./feature-key";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(
  __dirname,
  "../../../db/prisma/schema.prisma",
);

function parseFeatureKeyEnum(schemaText: string): string[] {
  const match = schemaText.match(/enum\s+FeatureKey\s*\{([^}]*)\}/);
  if (!match) {
    throw new Error(
      "Could not find `enum FeatureKey { ... }` in packages/db/prisma/schema.prisma",
    );
  }
  return match[1]!
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("//"));
}

describe("FEATURE_KEYS — mirrors packages/db/prisma/schema.prisma enum FeatureKey", () => {
  const schemaText = readFileSync(SCHEMA_PATH, "utf-8");
  const schemaValues = parseFeatureKeyEnum(schemaText);

  it("has the exact same values, in the exact same order, as the Prisma enum", () => {
    expect([...FEATURE_KEYS]).toEqual(schemaValues);
  });

  it("does not contain billing or user_management (structural guardrail)", () => {
    expect(FEATURE_KEYS).not.toContain("billing");
    expect(FEATURE_KEYS).not.toContain("user_management");
  });
});
