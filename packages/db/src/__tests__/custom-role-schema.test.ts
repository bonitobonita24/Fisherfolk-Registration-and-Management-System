/**
 * Schema tests — Custom-role permission-matrix (PD-005 Chunk 1)
 *
 * Covers the foundation of the fleet custom-role RBAC system:
 * `enum FeatureKey`, `model CustomRole`, `model RolePermission`, and
 * `User.customRoleId`. See ~/.claude/rules/tenant-rbac-standard.md §4.
 *
 * Two kinds of assertions:
 * 1. STATIC — read the generated migration.sql text directly. These run
 *    regardless of DB availability (no DATABASE_URL needed) and are the
 *    structural guardrail that the migration never DROPs anything.
 * 2. DB-gated — exercise the real Postgres schema (constraint existence,
 *    nullability). Skipped when DATABASE_URL is unset, mirroring
 *    apps/web/src/server/__tests__/tenant-succession.test.ts.
 *
 * DB: DATABASE_URL from .env.dev (repo root). Run via:
 *   set -a; source .env.dev; set +a
 *   pnpm -C packages/db exec vitest run src/__tests__/custom-role-schema.test.ts
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { platformPrisma } from "../index";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "../../prisma/migrations");

/**
 * Locate the custom-role-matrix migration directory by its distinctive name
 * suffix rather than a hardcoded timestamp, so this test doesn't need
 * updating if the migration is ever regenerated under a new timestamp.
 */
function findCustomRoleMigrationDir(): string {
  const dirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith("_add_custom_role_matrix"))
    .map((d) => d.name);

  if (dirs.length === 0) {
    throw new Error(
      "No migration directory ending in `_add_custom_role_matrix` found under prisma/migrations. " +
        "Expected the PD-005 Chunk 1 custom-role permission-matrix migration to exist.",
    );
  }
  // Deterministic if more than one ever exists (shouldn't happen).
  return dirs.sort().at(-1)!;
}

const migrationDirName = findCustomRoleMigrationDir();
const migrationSql = readFileSync(
  join(MIGRATIONS_DIR, migrationDirName, "migration.sql"),
  "utf-8",
);

// ─── 1. Static — migration SQL is additive-only ────────────────────────────

describe("custom-role-matrix migration — additive-only guardrail", () => {
  it("contains no DROP TYPE statement", () => {
    expect(migrationSql).not.toMatch(/DROP\s+TYPE/i);
  });

  it("contains no DROP TABLE statement", () => {
    expect(migrationSql).not.toMatch(/DROP\s+TABLE/i);
  });

  it("contains no DROP COLUMN statement", () => {
    expect(migrationSql).not.toMatch(/DROP\s+COLUMN/i);
  });

  it("adds users.custom_role_id as a nullable column (no NOT NULL)", () => {
    const addColumnLine = migrationSql
      .split("\n")
      .find((line) => /ADD\s+COLUMN\s+"custom_role_id"/i.test(line));
    expect(addColumnLine).toBeDefined();
    expect(addColumnLine).not.toMatch(/NOT NULL/i);
  });
});

// ─── 2. Static — FeatureKey structural guardrail (billing/user_management absent) ──

describe("FeatureKey enum — structural guardrail", () => {
  it("the CREATE TYPE \"FeatureKey\" statement contains no billing value", () => {
    const enumLine = migrationSql
      .split("\n")
      .find((line) => /CREATE\s+TYPE\s+"FeatureKey"/i.test(line));
    expect(enumLine).toBeDefined();
    expect(enumLine!.toLowerCase()).not.toMatch(/'billing'/);
  });

  it("the CREATE TYPE \"FeatureKey\" statement contains no user_management value", () => {
    const enumLine = migrationSql
      .split("\n")
      .find((line) => /CREATE\s+TYPE\s+"FeatureKey"/i.test(line));
    expect(enumLine).toBeDefined();
    expect(enumLine!.toLowerCase()).not.toMatch(/'user_management'/);
  });
});

// ─── 3. DB-gated — live schema assertions ──────────────────────────────────

const hasDb = Boolean(process.env.DATABASE_URL);
const describeDb = hasDb ? describe : describe.skip;

describeDb("custom-role-matrix — live Postgres schema", () => {
  // Prisma's `@@unique` emits `CREATE UNIQUE INDEX` (not `ADD CONSTRAINT
  // UNIQUE`) — Postgres registers this as a unique INDEX (pg_indexes /
  // pg_class.relkind='i'), not a row in pg_constraint (contype='u'). Query
  // pg_indexes accordingly.
  it("role_permissions has a unique constraint on (role_id, feature_key)", async () => {
    const rows = await platformPrisma.$queryRawUnsafe<
      Array<{ indexname: string }>
    >(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'role_permissions'
        AND indexname = 'role_permissions_role_id_feature_key_key'
        AND indexdef ILIKE 'CREATE UNIQUE INDEX%';
    `);
    expect(rows).toHaveLength(1);
  });

  it("custom_roles has a unique constraint on (tenant_id, name)", async () => {
    const rows = await platformPrisma.$queryRawUnsafe<
      Array<{ indexname: string }>
    >(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'custom_roles'
        AND indexname = 'custom_roles_tenant_id_name_key'
        AND indexdef ILIKE 'CREATE UNIQUE INDEX%';
    `);
    expect(rows).toHaveLength(1);
  });

  it("users.custom_role_id is nullable", async () => {
    const rows = await platformPrisma.$queryRawUnsafe<
      Array<{ is_nullable: string }>
    >(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'custom_role_id';
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.is_nullable).toBe("YES");
  });

  it("the FeatureKey enum contains no billing or user_management value", async () => {
    const rows = await platformPrisma.$queryRawUnsafe<
      Array<{ enumlabel: string }>
    >(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = '"FeatureKey"'::regtype;
    `);
    const labels = rows.map((r) => r.enumlabel);
    expect(labels).not.toContain("billing");
    expect(labels).not.toContain("user_management");
    // Sanity: the registry is populated with the expected FRMS features.
    expect(labels).toEqual(
      expect.arrayContaining([
        "fisherfolk",
        "households",
        "vessels",
        "fish_catches",
        "violations",
        "ayuda",
        "edit_requests",
        "kanban",
        "reports",
        "analytics",
        "map",
        "notifications",
        "id_generator",
        "import",
        "audit_log",
        "data_management",
      ]),
    );
  });

  it("existing UserRole enum values are untouched (data-preserving invariant)", async () => {
    const rows = await platformPrisma.$queryRawUnsafe<
      Array<{ enumlabel: string }>
    >(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = '"UserRole"'::regtype;
    `);
    const labels = rows.map((r) => r.enumlabel);
    expect(labels).toEqual(
      expect.arrayContaining([
        "tenant_manager",
        "tenant_superadmin",
        "tenant_admin",
        "encoder",
        "viewer",
        "bantay_dagat",
      ]),
    );
  });
});
