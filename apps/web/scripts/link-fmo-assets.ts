#!/usr/bin/env tsx
/**
 * link-fmo-assets.ts — CLI script to attach FMO photo/signature image files
 * to already-imported fisherfolk records via the project's storage pipeline.
 *
 * Usage (run from apps/web):
 *   pnpm exec tsx scripts/link-fmo-assets.ts \
 *     --map <path.json>       (required — JSON array of { idNumber, image, signature })
 *     --assets <dir>          (required — directory containing the image files)
 *     [--tenant <slug>]       (default: "calapan-city")
 *     [--limit <n>]           (optional cap for smoke tests)
 *     [--dry]                 (flag — validate counts, NO uploads or DB writes)
 *
 * Map file shape:
 *   Array of { idNumber: string, image: string | null, signature: string | null }
 *
 * File-name casing note:
 *   Filenames are used VERBATIM from the map (the FMO export uses uppercase
 *   extensions like .JPG / .PNG — do NOT lowercase them).
 */

import fs from "node:fs";
import path from "node:path";

// ── Bootstrap: load repo-root .env.dev before PrismaClient instantiation ─────

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
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {
    // File absent — skip silently
  }
}

// Run from apps/web; repo root is two levels up
loadEnvFile(path.resolve(process.cwd(), "../../.env.dev"));
loadEnvFile(path.resolve(process.cwd(), "../../.env"));

// ── Deferred imports (after env is loaded) ───────────────────────────────────

import { PrismaClient } from "@frms/db";
import { storeImportedAsset } from "../src/lib/import/asset-storage";

// ── CLI arg parsing ───────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = rawArgs.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  const next = rawArgs[idx + 1];
  return typeof next === "string" && !next.startsWith("--") ? next : undefined;
}

function hasFlag(name: string): boolean {
  return rawArgs.includes(`--${name}`);
}

const mapPath = getArg("map");
const assetsDir = getArg("assets");
const tenantSlug = getArg("tenant") ?? "calapan-city";
const dry = hasFlag("dry");
const limitStr = getArg("limit");
const limit =
  limitStr !== undefined && /^\d+$/.test(limitStr)
    ? parseInt(limitStr, 10)
    : undefined;

if (!mapPath) {
  console.error("❌  --map <path.json> is required");
  process.exit(1);
}
if (!assetsDir) {
  console.error("❌  --assets <dir> is required");
  process.exit(1);
}

// ── Map entry shape ───────────────────────────────────────────────────────────

interface MapEntry {
  idNumber: string;
  image: string | null;
  signature: string | null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // 1. Read + parse map JSON ---------------------------------------------------
  let mapEntries: MapEntry[];
  try {
    const raw = fs.readFileSync(mapPath!, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.error("❌  --map file must contain a JSON array");
      process.exit(1);
    }
    mapEntries = parsed as MapEntry[];
  } catch (err) {
    console.error("❌  Failed to read/parse --map file:", err);
    process.exit(1);
  }

  // Apply --limit
  if (limit !== undefined) {
    mapEntries = mapEntries.slice(0, limit);
  }

  console.log(`📂  Loaded ${mapEntries.length} map entries from ${mapPath}`);
  console.log(`📁  Assets directory: ${assetsDir}`);
  if (dry) {
    console.log("🔍  DRY RUN — no uploads or DB writes");
  }

  // 2. Setup Prisma + fetch tenant context -------------------------------------
  const prisma = new PrismaClient();

  try {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    const tenantId = tenant.id;
    console.log(`🏢  Tenant: ${tenantSlug} (${tenantId})`);

    // 3. Load existing records: idNumber → db id --------------------------------
    const existing = await prisma.fisherfolk.findMany({
      where: { tenantId },
      select: { id: true, idNumber: true },
    });
    const idMap = new Map<string, string>(
      existing.map((f) => [f.idNumber, f.id]),
    );
    console.log(`📋  Found ${idMap.size} fisherfolk records in DB\n`);

    // 4. Counters ---------------------------------------------------------------
    let matchedRecords = 0;
    let photosLinked = 0;
    let signaturesLinked = 0;
    let missingPhotoFile = 0;
    let missingSignatureFile = 0;
    let recordNotFound = 0;
    let errors = 0;

    // In dry-run we count separately to avoid naming collision
    let wouldPhoto = 0;
    let wouldSig = 0;

    // 5. Main loop --------------------------------------------------------------
    for (let i = 0; i < mapEntries.length; i++) {
      const entry = mapEntries[i];
      if (entry === undefined) continue;

      const dbId = idMap.get(entry.idNumber);
      if (dbId === undefined) {
        recordNotFound++;
        continue;
      }

      matchedRecords++;
      let photoKey: string | undefined;
      let sigKey: string | undefined;

      // ── PHOTO ──────────────────────────────────────────────────────────────
      if (entry.image) {
        const filePath = path.join(assetsDir!, entry.image);
        if (!fs.existsSync(filePath)) {
          missingPhotoFile++;
          console.warn(`  ⚠ photo file not found: ${entry.image}`);
        } else {
          if (dry) {
            wouldPhoto++;
          } else {
            try {
              const buffer = fs.readFileSync(filePath);
              photoKey = await storeImportedAsset({
                tenantId,
                idNumber: entry.idNumber,
                kind: "photo",
                buffer,
                originalFilename: entry.image,
              });
              photosLinked++;
            } catch (err: unknown) {
              errors++;
              const msg =
                err instanceof Error ? err.message : String(err);
              console.error(
                `  ✗ [photo] ${entry.idNumber}: ${msg}`,
              );
            }
          }
        }
      }

      // ── SIGNATURE ──────────────────────────────────────────────────────────
      if (entry.signature) {
        const filePath = path.join(assetsDir!, entry.signature);
        if (!fs.existsSync(filePath)) {
          missingSignatureFile++;
          console.warn(`  ⚠ signature file not found: ${entry.signature}`);
        } else {
          if (dry) {
            wouldSig++;
          } else {
            try {
              const buffer = fs.readFileSync(filePath);
              sigKey = await storeImportedAsset({
                tenantId,
                idNumber: entry.idNumber,
                kind: "signature",
                buffer,
                originalFilename: entry.signature,
              });
              signaturesLinked++;
            } catch (err: unknown) {
              errors++;
              const msg =
                err instanceof Error ? err.message : String(err);
              console.error(
                `  ✗ [sig] ${entry.idNumber}: ${msg}`,
              );
            }
          }
        }
      }

      // ── DB UPDATE ──────────────────────────────────────────────────────────
      if (!dry && (photoKey !== undefined || sigKey !== undefined)) {
        try {
          await prisma.fisherfolk.update({
            where: { id: dbId },
            data: {
              ...(photoKey !== undefined ? { photo: photoKey } : {}),
              ...(sigKey !== undefined ? { signature: sigKey } : {}),
            },
          });
        } catch (err: unknown) {
          errors++;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  ✗ [db-update] ${entry.idNumber}: ${msg}`);
        }
      }

      // Progress heartbeat every 250 records
      if ((i + 1) % 250 === 0) {
        if (dry) {
          console.log(
            `  … ${i + 1} processed | matched=${matchedRecords} notFound=${recordNotFound} wouldPhoto=${wouldPhoto} wouldSig=${wouldSig}`,
          );
        } else {
          console.log(
            `  … ${i + 1} processed | matched=${matchedRecords} notFound=${recordNotFound} photos=${photosLinked} sigs=${signaturesLinked} errors=${errors}`,
          );
        }
      }
    }

    // 6. Summary ----------------------------------------------------------------
    console.log("\n📋  SUMMARY");
    console.log(`    tenant            : ${tenantSlug}`);
    console.log(`    total processed   : ${mapEntries.length}`);
    console.log(`    matched records   : ${matchedRecords}`);
    console.log(`    record not found  : ${recordNotFound}`);
    if (dry) {
      console.log(`    would link photos : ${wouldPhoto}`);
      console.log(`    would link sigs   : ${wouldSig}`);
    } else {
      console.log(`    photos linked     : ${photosLinked}`);
      console.log(`    signatures linked : ${signaturesLinked}`);
    }
    console.log(`    missing photo file: ${missingPhotoFile}`);
    console.log(`    missing sig file  : ${missingSignatureFile}`);
    console.log(`    errors            : ${errors}`);

    if (dry) {
      console.log("\n🔍  DRY RUN — no uploads or DB writes performed.");
    } else {
      console.log("\n✅  Asset linking complete.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("❌  Fatal:", err);
  process.exit(1);
});
