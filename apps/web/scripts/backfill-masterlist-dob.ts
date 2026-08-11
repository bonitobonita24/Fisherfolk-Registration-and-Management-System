#!/usr/bin/env tsx
/**
 * backfill-masterlist-dob.ts — CLI script to backfill date_of_birth for
 * fisherfolk records that imported with a NULL dob, re-parsing the SAME
 * masterlist Excel with the corrected DOB cell coercion (see
 * import-masterlist-batch.ts dobCellToString) + normalizeDob.
 *
 * FILL-ONLY-IF-NULL: never overwrites a record's existing non-null
 * date_of_birth. Idempotent: safe to re-run.
 *
 * Usage (run from apps/web):
 *   pnpm exec tsx scripts/backfill-masterlist-dob.ts [--confirm] \
 *     [--tenant-slug calapan-city] \
 *     [--xlsx for_importation/Masterlist.xlsx]
 *
 * Default = DRY RUN (no DB writes) — only --confirm performs writes.
 *
 * Fixed input path (relative to repo root — this script runs from apps/web,
 * so repo root is two levels up): for_importation/Masterlist.xlsx,
 * worksheet "Master List".
 *
 * Column mapping (row.values is 1-indexed with a leading undefined at [0]):
 *   [1]=ID NUMBER  [3]=DATE OF BIRTH  [2]=FULL NAME (used only for display)
 */

import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

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
import { normalizeDob } from "../src/lib/normalize/dob";
import { cellValueToString } from "../src/lib/import/excel";

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

const tenantSlug = getArg("tenant-slug") ?? "calapan-city";
const confirm = hasFlag("confirm");
const dry = !confirm;

// ── Fixed paths (repo root is two levels up from apps/web) ───────────────────

const REPO_ROOT = path.resolve(process.cwd(), "../..");
const xlsxArg = getArg("xlsx");
const XLSX_PATH = xlsxArg
  ? path.resolve(REPO_ROOT, xlsxArg)
  : path.join(REPO_ROOT, "for_importation", "Masterlist.xlsx");

const WORKSHEET_NAME = "Master List";

// ── Cell coercion (mirrors import-masterlist-batch.ts) ───────────────────────


/** Formats a JS Date using its LOCAL date parts (avoids UTC/toISOString TZ off-by-one). */
function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Converts an Excel serial day-count (epoch 1899-12-30, UTC) to YYYY-MM-DD. */
function excelSerialToDateString(serial: number): string {
  const EXCEL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);
  const ms = EXCEL_EPOCH_UTC_MS + serial * 86_400_000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

/**
 * Coerce the raw DOB cell (column [3]) to a normalizeDob-friendly string.
 * Same corrected coercion as import-masterlist-batch.ts dobCellToString.
 */
function dobCellToString(value: ExcelJS.CellValue | undefined): string {
  if (value instanceof Date) return formatLocalDate(value);

  if (typeof value === "number") return excelSerialToDateString(value);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed !== "" && !trimmed.includes("/") && /^\d+(\.\d+)?$/.test(trimmed)) {
      return excelSerialToDateString(Number(trimmed));
    }
    return trimmed;
  }

  return cellValueToString(value);
}

// ── Masterlist parsing (only idNumber + dob needed) ───────────────────────────

type SourceRow = {
  rowIndex: number;
  idNumber: string;
  fullName: string;
  rawDob: string;
};

async function parseMasterlistDob(xlsxPath: string): Promise<SourceRow[]> {
  const workbook = new ExcelJS.Workbook();
  const buf = fs.readFileSync(xlsxPath);

  // @ts-expect-error exceljs d.ts uses pre-TS5.7 unparameterized Buffer;
  // Buffer<ArrayBufferLike> is structurally compatible at runtime.
  await workbook.xlsx.load(buf);

  const worksheet = workbook.getWorksheet(WORKSHEET_NAME);
  if (!worksheet) {
    throw new Error(`Worksheet "${WORKSHEET_NAME}" not found in ${xlsxPath}`);
  }

  const rows: SourceRow[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // header row

    const values = row.values as Array<ExcelJS.CellValue | undefined>;

    const idNumber = cellValueToString(values[1]);
    if (!idNumber) return; // skip rows with empty column A

    const fullName = cellValueToString(values[2]);
    const rawDob = dobCellToString(values[3]);

    rows.push({ rowIndex: rowNumber, idNumber, fullName, rawDob });
  });

  return rows;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`🏢  Tenant: ${tenantSlug}`);
  console.log(`📄  Masterlist: ${XLSX_PATH} (worksheet "${WORKSHEET_NAME}")`);
  if (dry) {
    console.log("🔍  DRY RUN — no DB writes (pass --confirm to write)");
  }

  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`❌  Masterlist not found: ${XLSX_PATH}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    const tenantId = tenant.id;
    console.log(`    tenant id: ${tenantId}\n`);

    const sourceRows = await parseMasterlistDob(XLSX_PATH);
    console.log(`📂  Parsed ${sourceRows.length} rows from masterlist\n`);

    let scanned = 0;
    let filled = 0;
    let skippedHadDob = 0;
    let skippedNoParse = 0;
    let notFound = 0;
    const fillList: string[] = [];

    for (const row of sourceRows) {
      scanned++;

      const normResult = normalizeDob(row.rawDob);
      if (normResult.value === null) {
        skippedNoParse++;
        continue;
      }
      const parsedDate = new Date(normResult.value);

      const existing = await prisma.fisherfolk.findUnique({
        where: {
          tenantId_idNumber: { tenantId, idNumber: row.idNumber },
        },
        select: { id: true, dateOfBirth: true },
      });

      if (!existing) {
        notFound++;
        continue;
      }

      if (existing.dateOfBirth !== null) {
        skippedHadDob++;
        continue;
      }

      fillList.push(`${row.idNumber}|${row.fullName}|${normResult.value}`);

      if (dry) {
        filled++;
        continue;
      }

      await prisma.fisherfolk.update({
        where: { id: existing.id },
        data: { dateOfBirth: parsedDate },
      });
      filled++;
    }

    console.log("📋  SUMMARY");
    console.log(`    tenant           : ${tenantSlug}`);
    console.log(`    scanned          : ${scanned}`);
    console.log(`    ${dry ? "wouldFill" : "filled"}        : ${filled}`);
    console.log(`    skippedHadDob    : ${skippedHadDob}`);
    console.log(`    skippedNoParse   : ${skippedNoParse}`);
    console.log(`    notFound         : ${notFound}`);

    if (fillList.length > 0) {
      console.log(
        `\n${dry ? "🔍  DRY RUN — would fill" : "✅  Filled"} ${fillList.length} record(s):`,
      );
      for (const line of fillList) {
        console.log(`    ${line}`);
      }
    }

    if (dry) {
      console.log("\n   Re-run with --confirm to perform the backfill.");
    } else {
      console.log("\n✅  Backfill complete.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("❌  Fatal:", err);
  process.exit(1);
});
