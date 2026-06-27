#!/usr/bin/env tsx
/**
 * import-fmo.ts — CLI script to bulk-import FMO fisherfolk JSON data into FRMS.
 *
 * Usage (run from apps/web):
 *   pnpm exec tsx scripts/import-fmo.ts \
 *     --data <path.json>          (required)
 *     [--assets <dir>]            (asset directory for photos/signatures)
 *     [--tenant <slug>]           (default: "calapan-city")
 *     [--report <csv>]            (missing-assets CSV output, default: ./missing-assets.csv)
 *     [--with-assets]             (flag: link assets from --assets dir)
 *     [--dry]                     (flag: validate + print counts, NO DB writes)
 *     [--limit <n>]               (cap row count for smoke tests)
 *
 * Signature file convention for --with-assets:
 *   photos    — files that do NOT contain "_sig." in the name (e.g. "PD-001.jpg")
 *   signatures — files that contain "_sig." in the name    (e.g. "PD-001_sig.jpg")
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
// These are hoisted by the JS runtime but DATABASE_URL is set before any
// PrismaClient is *instantiated* — which happens inside main().

import { PrismaClient } from "@frms/db";
import {
  buildValidationReport,
  type ValidationContext,
} from "../src/lib/import/validate";
import { buildQRPayload } from "../src/lib/qr-code";
import { omitUndefined } from "../src/server/lib/prisma-input";
import {
  matchAssets,
  buildMissingAssetsCsv,
} from "../src/lib/import/assets";
import { storeImportedAsset } from "../src/lib/import/asset-storage";

// ── CLI arg parsing ───────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = rawArgs.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  const next = rawArgs[idx + 1];
  // Value token must exist and must not start with "--"
  return typeof next === "string" && !next.startsWith("--") ? next : undefined;
}

function hasFlag(name: string): boolean {
  return rawArgs.includes(`--${name}`);
}

const dataPath = getArg("data");
const assetsDir = getArg("assets");
const tenantSlug = getArg("tenant") ?? "calapan-city";
const reportPath = getArg("report") ?? "./missing-assets.csv";
const withAssets = hasFlag("with-assets");
const dry = hasFlag("dry");
const limitStr = getArg("limit");
const limit =
  limitStr !== undefined && /^\d+$/.test(limitStr)
    ? parseInt(limitStr, 10)
    : undefined;

if (!dataPath) {
  console.error("❌  --data <path> is required");
  process.exit(1);
}

// ── FMO source row shape ──────────────────────────────────────────────────────

interface FmoRow {
  id_number?: string;
  full_name?: string;
  date_of_birth?: string;
  address?: string;
  sex?: string;
  image?: string;
  signature?: string;
  rsbsa?: string;
  contact_number?: string;
  boat_owneroperator?: string;
  capture_fishing?: string;
  gleaning?: string;
  vendor?: string;
  fish_processing?: string;
  aquaculture?: string;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // 1. Read + parse JSON -------------------------------------------------------
  let fmoRows: FmoRow[];
  try {
    const raw = fs.readFileSync(dataPath!, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.error("❌  --data file must contain a JSON array");
      process.exit(1);
    }
    fmoRows = parsed as FmoRow[];
  } catch (err) {
    console.error("❌  Failed to read/parse --data file:", err);
    process.exit(1);
  }

  // Apply --limit
  if (limit !== undefined) {
    fmoRows = fmoRows.slice(0, limit);
  }

  console.log(`📂  Loaded ${fmoRows.length} rows from ${dataPath}`);

  // 2. Setup Prisma + fetch tenant context -------------------------------------
  const prisma = new PrismaClient();

  try {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug: tenantSlug },
      select: {
        id: true,
        barangayList: true,
        currentRegistrationYear: true,
      },
    });
    const tenantId = tenant.id;
    const currentRegistrationYear = tenant.currentRegistrationYear;

    // Barangay aliases → typoMap
    const aliases = await prisma.barangayAlias.findMany({ where: { tenantId } });
    const typoMap: Record<string, string> = {};
    for (const a of aliases) {
      typoMap[a.fromLabel] = a.toLabel;
    }

    // Existing fisherfolk id numbers (for idempotency)
    const existingRecords = await prisma.fisherfolk.findMany({
      where: { tenantId },
      select: { idNumber: true },
    });
    const existingIdNumbers = new Set(existingRecords.map((f) => f.idNumber));

    // Category name (lowercase) → id map
    const categoryRecords = await prisma.category.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const catMap = new Map<string, string>();
    for (const c of categoryRecords) {
      catMap.set(c.name.toLowerCase(), c.id);
    }

    // First tenant user → createdById / updatedById
    const firstUser = await prisma.user.findFirst({
      where: { tenantId },
      select: { id: true },
    });
    const adminId = firstUser?.id ?? null;

    // 3. Map FMO rows → RawImportRow ------------------------------------------
    //
    // Keywords are chosen so mapCategory() in normalize/category.ts picks the
    // correct canonical label:
    //   "boat owner"      → "Boat Owner/Operator"
    //   "capture fishing" → "Capture Fishing"      (contains "capture fish")
    //   "gleaning"        → "Gleaning"
    //   "vendor"          → "Vendor"               (contains "vend")
    //   "fish processing" → "Fish Processing"       (contains "processing")
    //   "aquaculture"     → "Aquaculture"

    const rawRows = fmoRows.map((row): Record<string, string> => {
      const dob = row.date_of_birth ?? "";
      const dateOfBirth =
        !dob || dob === "None" || dob === "0000-00-00" ? "" : dob;

      const rsbsa = row.rsbsa ?? "";
      const rsbsaNumber = rsbsa === "None" || !rsbsa ? "" : rsbsa;

      const cn = row.contact_number ?? "";
      const contactNumber = cn === "None" || !cn ? "" : cn;

      const categoryParts: string[] = [];
      if (row.boat_owneroperator === "1") categoryParts.push("boat owner");
      if (row.capture_fishing === "1") categoryParts.push("capture fishing");
      if (row.gleaning === "1") categoryParts.push("gleaning");
      if (row.vendor === "1") categoryParts.push("vendor");
      if (row.fish_processing === "1") categoryParts.push("fish processing");
      if (row.aquaculture === "1") categoryParts.push("aquaculture");

      return {
        idNumber: row.id_number ?? "",
        fullName: row.full_name ?? "",
        dateOfBirth,
        address: row.address ?? "",
        sex: row.sex ?? "",
        rsbsaNumber,
        contactNumber,
        image: row.image ?? "",
        signature: row.signature ?? "",
        remarks: "",
        category: categoryParts.join(", "),
      };
    });

    // 4. Build validation report -----------------------------------------------
    const validationCtx: ValidationContext = {
      barangayList: tenant.barangayList,
      typoMap,
      existingIdNumbers,
    };

    const report = buildValidationReport(rawRows, validationCtx);
    const { counts } = report;

    console.log("\n📊  Validation report:");
    console.log(`    total      : ${counts.total}`);
    console.log(`    valid      : ${counts.valid}`);
    console.log(`    warning    : ${counts.warning}`);
    console.log(`    error      : ${counts.error}`);
    console.log(`    duplicates : ${counts.duplicates}`);
    console.log(`    collisions : ${counts.collisions}`);
    console.log(`    existing   : ${counts.existing}`);
    console.log(`    toImport   : ${counts.toImport}`);
    console.log(`    toSkip     : ${counts.toSkip}`);

    // 5. Dry-run early exit ----------------------------------------------------
    if (dry) {
      console.log("\n🔍  Dry-run — first 5 row reports:");
      const preview = report.rows.slice(0, 5);
      for (const r of preview) {
        const warnSuffix =
          r.warnings.length > 0 ? ` | ⚠ ${r.warnings.join("; ")}` : "";
        console.log(
          `    [${r.rowIndex}] ${r.idNumber} | ${r.status} | ${r.action}${warnSuffix}`,
        );
      }
      console.log("\n✅  Dry-run complete — no DB writes.");
      return;
    }

    // 6. Import loop -----------------------------------------------------------
    const importableRows = report.rows.filter(
      (r) => r.status !== "error" && r.action === "import",
    );
    console.log(`\n🚀  Importing ${importableRows.length} rows...`);

    let imported = 0;
    let skipped = 0;
    const importedRecords: Array<{ idNumber: string; id: string }> = [];

    for (let i = 0; i < importableRows.length; i++) {
      const r = importableRows[i];
      if (r === undefined) continue;
      const n = r.normalized;

      try {
        const data = omitUndefined({
          tenantId,
          idNumber: r.idNumber,
          fullName: n.fullName,
          lastName: n.lastName,
          firstName: n.firstName,
          middleName: n.middleName ?? undefined,
          dateOfBirth: n.dateOfBirth ? new Date(n.dateOfBirth) : null,
          sex:
            n.sex == null
              ? null
              : n.sex === "Male"
                ? ("MALE" as const)
                : ("FEMALE" as const),
          address: n.address || "",
          barangay: n.barangay ?? "",
          contactNumber: n.contactNumber ?? undefined,
          rsbsaNumber: n.rsbsaNumber ?? undefined,
          categoryIds: n.categories
            .map((c) => catMap.get(c.toLowerCase()))
            .filter((id): id is string => id !== undefined),
          remarks: n.remarks ?? undefined,
          status: "ACTIVE" as const,
          registrationYear: currentRegistrationYear,
          createdById: adminId ?? undefined,
          updatedById: adminId ?? undefined,
        });

        const created = await prisma.fisherfolk.create({ data });

        await prisma.fisherfolk.update({
          where: { id: created.id },
          data: {
            qrCode: buildQRPayload({
              id: created.id,
              regNo: created.idNumber,
              tenantId,
            }),
          },
        });

        importedRecords.push({ idNumber: r.idNumber, id: created.id });
        imported++;
      } catch (err: unknown) {
        // Idempotent: skip on unique-constraint violation (same idNumber)
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: string }).code === "P2002"
        ) {
          skipped++;
          continue;
        }
        throw err;
      }

      if ((i + 1) % 250 === 0) {
        console.log(
          `    … ${i + 1} processed (${imported} imported, ${skipped} skipped)`,
        );
      }
    }

    console.log(
      `\n✅  Import complete: ${imported} imported, ${skipped} skipped`,
    );

    // 7. Asset phase (only when --with-assets and --assets given) --------------
    if (withAssets && assetsDir !== undefined) {
      console.log(`\n🖼   Linking assets from ${assetsDir} ...`);

      let allFiles: string[] = [];
      try {
        allFiles = fs.readdirSync(assetsDir);
      } catch (err) {
        console.error("❌  Failed to read assets dir:", err);
        allFiles = [];
      }

      // Build quick lookups
      const importedIdNumbers = importedRecords.map((r) => r.idNumber);
      const idToDbId = new Map<string, string>(
        importedRecords.map((r) => [r.idNumber, r.id]),
      );

      // Separate photos vs signatures by "_sig." convention
      const photoFiles = allFiles.filter((f) => !/_sig\./i.test(f));
      const sigFilesRaw = allFiles.filter((f) => /_sig\./i.test(f));

      // For signature matching: strip "_sig" from the stem so assetKeyFromFilename
      // maps the file to the same key as the fisherfolk idNumber.
      // e.g. "PD-001_sig.jpg" → virtual name "PD-001.jpg" → key "pd-001"
      const sigVirtualToOriginal = new Map<string, string>();
      const sigFilesVirtual: string[] = [];
      for (const f of sigFilesRaw) {
        const dotIdx = f.lastIndexOf(".");
        const ext = dotIdx !== -1 ? f.slice(dotIdx) : "";
        const stem = (dotIdx !== -1 ? f.slice(0, dotIdx) : f).replace(
          /_sig$/i,
          "",
        );
        const virtual = stem + ext;
        sigVirtualToOriginal.set(virtual, f);
        sigFilesVirtual.push(virtual);
      }

      const photoMatch = matchAssets(importedIdNumbers, photoFiles);
      const sigMatch = matchAssets(importedIdNumbers, sigFilesVirtual);

      const photoLinked = new Set<string>();
      const sigLinked = new Set<string>();

      // Link photos
      for (const [idNumber, filename] of photoMatch.matched) {
        const dbId = idToDbId.get(idNumber);
        if (dbId === undefined) continue;
        const filePath = path.join(assetsDir, filename);
        try {
          const buffer = fs.readFileSync(filePath);
          const key = await storeImportedAsset({
            tenantId,
            idNumber,
            kind: "photo",
            buffer,
            originalFilename: filename,
          });
          await prisma.fisherfolk.update({
            where: { id: dbId },
            data: { photo: key },
          });
          photoLinked.add(idNumber);
        } catch (err) {
          console.error(`    ⚠ photo link failed for ${idNumber}:`, err);
        }
      }

      // Link signatures
      for (const [idNumber, virtualFilename] of sigMatch.matched) {
        const dbId = idToDbId.get(idNumber);
        if (dbId === undefined) continue;
        const originalFilename =
          sigVirtualToOriginal.get(virtualFilename) ?? virtualFilename;
        const filePath = path.join(assetsDir, originalFilename);
        try {
          const buffer = fs.readFileSync(filePath);
          const key = await storeImportedAsset({
            tenantId,
            idNumber,
            kind: "signature",
            buffer,
            originalFilename,
          });
          await prisma.fisherfolk.update({
            where: { id: dbId },
            data: { signature: key },
          });
          sigLinked.add(idNumber);
        } catch (err) {
          console.error(`    ⚠ signature link failed for ${idNumber}:`, err);
        }
      }

      // Build missing-assets CSV
      const idToRowReport = new Map(
        report.rows
          .filter((r) => r.status !== "error" && r.action === "import")
          .map((r) => [r.idNumber, r]),
      );

      const missingRows: Array<{
        idNumber: string;
        missing: "photo" | "signature" | "both";
      }> = [];

      for (const idNumber of importedIdNumbers) {
        const hasPhoto = photoLinked.has(idNumber);
        const hasSig = sigLinked.has(idNumber);
        if (hasPhoto && hasSig) continue;

        const missing: "photo" | "signature" | "both" =
          !hasPhoto && !hasSig ? "both" : !hasPhoto ? "photo" : "signature";

        const rowReport = idToRowReport.get(idNumber);
        if (rowReport !== undefined) {
          missingRows.push({
            idNumber,
            // fullName and address: only include when present to satisfy
            // exactOptionalPropertyTypes (no explicit undefined)
            ...(rowReport.normalized.fullName
              ? { fullName: rowReport.normalized.fullName }
              : {}),
            ...(rowReport.normalized.address
              ? { address: rowReport.normalized.address }
              : {}),
            missing,
          });
        } else {
          missingRows.push({ idNumber, missing });
        }
      }

      const csv = buildMissingAssetsCsv(missingRows);
      fs.writeFileSync(reportPath, csv, "utf8");

      console.log(`    photos linked    : ${photoLinked.size}`);
      console.log(`    signatures linked: ${sigLinked.size}`);
      console.log(
        `    missing CSV      : ${reportPath} (${missingRows.length} records)`,
      );
    }

    // 8. Final summary ---------------------------------------------------------
    console.log("\n📋  Final summary:");
    console.log(`    tenant    : ${tenantSlug}`);
    console.log(`    total rows: ${counts.total}`);
    console.log(`    imported  : ${imported}`);
    console.log(`    skipped   : ${skipped}`);
    if (withAssets && assetsDir !== undefined) {
      console.log(`    report    : ${reportPath}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("❌  Fatal:", err);
  process.exit(1);
});
