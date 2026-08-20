#!/usr/bin/env tsx
/**
 * align-demo-categories.ts — Realign a demo tenant's fisherfolk categories to
 * the OFFICIAL calapan-city taxonomy.
 *
 * PURPOSE
 *   The live `frms-demo` tenant (slug "demo") was seeded with an INVENTED set of
 *   8 categories (Municipal Fisherfolk / Commercial / Fish Vendor / Aquaculture /
 *   Gleaner / Fish Processor / Bantay Dagat Volunteer / Senior Fisherfolk) that do
 *   NOT match the authoritative 6-category set used by the real `calapan-city`
 *   tenant (packages/db/prisma/seed.ts `defaultCategories`). This script:
 *     1. Upserts the 6 canonical categories for the target tenant.
 *     2. RANDOMLY reassigns every fisherfolk row across those 6, weighted to
 *        MIRROR calapan-city's real category proportions (CALAPAN_PROPORTIONS
 *        below). No semantic mapping of the old categories — a clean re-roll.
 *     3. Deletes the leftover invented Category rows so ONLY the canonical 6
 *        remain. (Category.id is referenced by Fisherfolk.categoryIds — a plain
 *        String[] with NO foreign key — so deletion is safe once every fisherfolk
 *        has been reassigned to canonical ids, which step 2 guarantees.)
 *
 * IDEMPOTENT + TRANSACTIONAL
 *   All mutations run inside a single prisma.$transaction. Running twice leaves
 *   exactly 6 categories and valid categoryIds; with the default fixed RNG seed
 *   a re-run reproduces the identical assignment set (harmless re-write).
 *
 * ⚠ DEMO / DEV DATA ONLY — reseed-never rationale
 *   Per docs/DATA_SEEDING_POLICY.md (owner-set 2026-07-08) the demo stack is a
 *   deliberate-push env: migrations YES, re-seed NEVER (curated demo data is
 *   preserved). This script is the SANCTIONED way to correct the demo taxonomy
 *   WITHOUT a destructive re-seed — it mutates only Category rows + the
 *   fisherfolk.categoryIds array for ONE named tenant, touching nothing else.
 *   It targets the LIVE demo DB via DATABASE_URL, so it is guarded by
 *   ALLOW_DEMO_SEED (like the demo seed scripts) and validates the tenant exists
 *   (it NEVER creates a tenant).
 *
 * USAGE (run from apps/web; env is auto-loaded from ../../.env.dev + ../../.env,
 * or pass DATABASE_URL / DEMO_TENANT_SLUG inline):
 *   ALLOW_DEMO_SEED=1 DEMO_TENANT_SLUG=demo DRY_RUN=1 \
 *     pnpm --filter @frms/web exec tsx scripts/align-demo-categories.ts   # preview
 *   ALLOW_DEMO_SEED=1 DEMO_TENANT_SLUG=demo \
 *     pnpm --filter @frms/web exec tsx scripts/align-demo-categories.ts   # apply
 *
 *   Env:
 *     DATABASE_URL       (required) — target DB. For the live demo, point this at
 *                        the demo stack's DB (see deploy/ push-to-demo runbook).
 *     DEMO_TENANT_SLUG   (default "demo") — the live frms-demo tenant slug.
 *     DRY_RUN=1          compute + print the summary WITHOUT writing.
 *     ALLOW_DEMO_SEED=1  required to run (demo/dev guard; refuses otherwise).
 *     SEED=<n>           (default 4242) deterministic RNG seed.
 */

import fs from "node:fs";
import path from "node:path";

// ── Bootstrap: load repo-root env before PrismaClient instantiation ──────────
function loadEnvFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const raw of content.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      // Never override an env var already set by the caller.
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* file absent — skip */
  }
}
loadEnvFile(path.resolve(process.cwd(), "../../.env.dev"));
loadEnvFile(path.resolve(process.cwd(), "../../.env"));

// ── HARD GUARD — demo/dev data only (mirrors seed-demo-calapan-extras.ts) ────
if (
  process.env["ALLOW_DEMO_SEED"] !== "1" &&
  process.env["ALLOW_DEMO_SEED"] !== "true"
) {
  console.error(
    "❌ REFUSED: align-demo-categories.ts mutates DEMO Category rows + fisherfolk.categoryIds.\n" +
      "   Policy (docs/DATA_SEEDING_POLICY.md): demo/dummy data ops are for LOCAL DEV + the\n" +
      "   DEMO stack ONLY — NEVER staging or production. Re-run with ALLOW_DEMO_SEED=1 only\n" +
      "   when the target DB is local dev or the demo stack.",
  );
  process.exit(1);
}

import { PrismaClient } from "@frms/db";

// ── Config ───────────────────────────────────────────────────────────────────
const DEMO_TENANT_SLUG = process.env["DEMO_TENANT_SLUG"] ?? "demo";
const DRY_RUN = process.env["DRY_RUN"] === "1" || process.env["DRY_RUN"] === "true";
const RNG_SEED = /^\d+$/.test(process.env["SEED"] ?? "") ? parseInt(process.env["SEED"]!, 10) : 4242;

// Canonical 6-category taxonomy — VERBATIM from packages/db/prisma/seed.ts
// `defaultCategories` (name/slug/description/displayOrder) with that file's
// shared displayColor / iconType / iconEmoji. Index === displayOrder-1.
const CANONICAL_CATEGORIES: Array<{
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
}> = [
  { name: "Boat Owner/Operator", slug: "boat-owner-operator", description: "Owner or operator of a registered fishing vessel", displayOrder: 1 },
  { name: "Capture Fishing", slug: "capture-fishing", description: "Engaged in municipal capture fishing", displayOrder: 2 },
  { name: "Gleaning", slug: "gleaning", description: "Engaged in gleaning of shells/marine organisms", displayOrder: 3 },
  { name: "Vendor", slug: "vendor", description: "Fish vendor or trader", displayOrder: 4 },
  { name: "Fish Processing", slug: "fish-processing", description: "Engaged in fish processing", displayOrder: 5 },
  { name: "Aquaculture", slug: "aquaculture", description: "Engaged in aquaculture/fish farming", displayOrder: 6 },
];
const CANONICAL_DISPLAY_COLOR = "#4F8EF7";
const CANONICAL_ICON_EMOJI = "🐟";
const CANONICAL_SLUGS = CANONICAL_CATEGORIES.map((c) => c.slug);

// Weighted distribution mirroring the REAL calapan-city tenant, MEASURED
// read-only from the local dev DB on 2026-08-20 (tenant "City of Calapan -
// Fisheries Management Office", 3089 fisherfolk / 4204 category assignments):
//   boat-owner-operator 1171 (27.9%) · capture-fishing 2056 (48.9%) ·
//   gleaning 225 (5.4%) · vendor 653 (15.5%) · fish-processing 32 (0.8%) ·
//   aquaculture 67 (1.6%).
// Baked as integer percentage weights in canonical displayOrder order
// (sum = 100). Relative weights are what matter to the weighted pick.
const CALAPAN_PROPORTIONS = [28, 48, 5, 16, 1, 2];
const TOTAL_WEIGHT = CALAPAN_PROPORTIONS.reduce((a, b) => a + b, 0);

// ── Deterministic RNG (mulberry32) — mirrors the demo seed scripts ───────────
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(RNG_SEED);

function pickWeightedIndex(): number {
  let roll = rng() * TOTAL_WEIGHT;
  for (let i = 0; i < CALAPAN_PROPORTIONS.length; i++) {
    roll -= CALAPAN_PROPORTIONS[i]!;
    if (roll < 0) return i;
  }
  return 0;
}
// One weighted primary category; ~35% of rows carry a distinct 2nd (mirrors the
// existing seed-demo behaviour). Returns canonical-category indices (deduped).
function pickCategoryIndices(): number[] {
  const primary = pickWeightedIndex();
  const indices = [primary];
  if (rng() < 0.35) {
    const secondary = pickWeightedIndex();
    if (secondary !== primary) indices.push(secondary);
  }
  return indices;
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: DEMO_TENANT_SLUG },
      select: { id: true, name: true, slug: true },
    });
    if (!tenant) {
      console.error(
        `❌ ABORT: tenant slug "${DEMO_TENANT_SLUG}" not found in the target DB. ` +
          `This script NEVER creates a tenant — verify DATABASE_URL points at the ` +
          `right DB and DEMO_TENANT_SLUG is correct.`,
      );
      process.exit(1);
    }
    const tenantId = tenant.id;

    const before = await prisma.category.findMany({
      where: { tenantId },
      select: { id: true, name: true, slug: true },
      orderBy: { displayOrder: "asc" },
    });
    const ff = await prisma.fisherfolk.findMany({ where: { tenantId }, select: { id: true } });

    // Compute proposed assignments (index-based; ids resolved after upsert).
    const assignments = ff.map((f) => ({ id: f.id, idx: pickCategoryIndices() }));
    const afterCounts = CANONICAL_CATEGORIES.map(() => 0);
    for (const a of assignments) for (const i of a.idx) afterCounts[i]!++;

    const leftover = before.filter((c) => !CANONICAL_SLUGS.includes(c.slug));

    console.log(`\n── align-demo-categories ${DRY_RUN ? "(DRY RUN — no writes)" : "(APPLYING)"} ──`);
    console.log(`Tenant: ${tenant.name} (slug "${tenant.slug}", id ${tenantId})`);
    console.log(`Fisherfolk rows: ${ff.length}   RNG seed: ${RNG_SEED}`);
    console.log(`\nCategories BEFORE (${before.length}):`);
    for (const c of before) {
      const kept = CANONICAL_SLUGS.includes(c.slug) ? "keep" : "DELETE";
      console.log(`  - ${c.name} [${c.slug}] → ${kept}`);
    }
    console.log(`\nCategories AFTER (6 canonical) + per-category record counts:`);
    CANONICAL_CATEGORIES.forEach((c, i) => {
      const pct = ff.length ? ((afterCounts[i]! / ff.length) * 100).toFixed(1) : "0.0";
      console.log(`  - ${c.name} [${c.slug}]: ${afterCounts[i]} rows (${pct}% of fisherfolk)`);
    });
    console.log(`\nRows to be reassigned: ${assignments.length}`);
    console.log(`Leftover invented categories to delete: ${leftover.length}` +
      (leftover.length ? ` (${leftover.map((c) => c.slug).join(", ")})` : ""));

    if (DRY_RUN) {
      console.log(`\n✅ DRY RUN complete — nothing written.\n`);
      return;
    }

    await prisma.$transaction(
      async (tx) => {
        // 1. Upsert canonical categories → capture ids in canonical order.
        const idByIndex: string[] = [];
        for (let i = 0; i < CANONICAL_CATEGORIES.length; i++) {
          const c = CANONICAL_CATEGORIES[i]!;
          const row = await tx.category.upsert({
            where: { tenantId_slug: { tenantId, slug: c.slug } },
            update: {
              name: c.name,
              description: c.description,
              displayColor: CANONICAL_DISPLAY_COLOR,
              iconType: "EMOJI",
              iconEmoji: CANONICAL_ICON_EMOJI,
              displayOrder: c.displayOrder,
              status: "ACTIVE",
            },
            create: {
              tenantId,
              name: c.name,
              slug: c.slug,
              description: c.description,
              displayColor: CANONICAL_DISPLAY_COLOR,
              iconType: "EMOJI",
              iconEmoji: CANONICAL_ICON_EMOJI,
              displayOrder: c.displayOrder,
              status: "ACTIVE",
            },
            select: { id: true },
          });
          idByIndex.push(row.id);
        }

        // 2. Reassign every fisherfolk. Group by the resolved id-array so a few
        //    updateMany calls replace thousands of individual writes (keeps the
        //    transaction fast + within timeout).
        const groups = new Map<string, string[]>();
        for (const a of assignments) {
          const ids = Array.from(new Set(a.idx.map((i) => idByIndex[i]!)));
          const key = ids.slice().sort().join("|");
          const bucket = groups.get(key);
          if (bucket) bucket.push(a.id);
          else groups.set(key, [a.id]);
        }
        for (const [key, rowIds] of groups) {
          const categoryIds = key.split("|");
          await tx.fisherfolk.updateMany({
            where: { id: { in: rowIds } },
            data: { categoryIds },
          });
        }

        // 3. Delete leftover invented categories (no fisherfolk references them
        //    now — every row was just reassigned to canonical ids).
        await tx.category.deleteMany({
          where: { tenantId, slug: { notIn: CANONICAL_SLUGS } },
        });
      },
      { maxWait: 20_000, timeout: 120_000 },
    );

    const finalCats = await prisma.category.findMany({
      where: { tenantId },
      select: { slug: true },
      orderBy: { displayOrder: "asc" },
    });
    console.log(`\n✅ Applied. Categories now: ${finalCats.length} (${finalCats.map((c) => c.slug).join(", ")}).`);
    console.log(`   Reassigned ${assignments.length} fisherfolk rows.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
