#!/usr/bin/env tsx
/**
 * import-masterlist-batch.ts — CLI script to import NEW fisherfolk records
 * from an Excel masterlist into the DB.
 *
 * Records ONLY — no photo/signature asset handling (see
 * scripts/import-tempfiles.ts for asset linking). Insert-only + skip records
 * that already exist (dedup key = idNumber). Idempotent: safe to re-run.
 *
 * Usage (run from apps/web):
 *   pnpm exec tsx scripts/import-masterlist-batch.ts [--confirm] \
 *     [--tenant-slug calapan-city] [--limit 100] \
 *     [--xlsx for_importation/Masterlist.xlsx] [--skip-header-check]
 *
 * Default = DRY RUN (no DB writes) — only --confirm performs writes.
 * Row 1 headers are asserted against the expected positional layout before
 * parsing (fail loud on a reshuffled spreadsheet) — pass --skip-header-check
 * to bypass.
 *
 * Fixed input path (relative to repo root — this script runs from apps/web,
 * so repo root is two levels up): for_importation/Masterlist.xlsx,
 * worksheet "Master List".
 *
 * Column mapping (row.values is 1-indexed with a leading undefined at [0]):
 *   [1]=ID NUMBER  [2]=FULL NAME  [3]=DATE OF BIRTH  [4]=ADDRESS  [5]=SEX
 *   [6]=IMAGE(ignored)  [7]=SIGNATURE(ignored)  [8]=RSBSA #  [9]=CATEGORY
 *   [10]=CONTACT NUMBER
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

import { PrismaClient, Prisma } from "@frms/db";
import {
  buildValidationReport,
  type ValidationContext,
  type RowReport,
} from "../src/lib/import/validate";
import type { RawImportRow } from "../src/lib/import/excel";
import { cellValueToString } from "../src/lib/import/excel";
import { omitUndefined } from "../src/server/lib/prisma-input";
import { buildQRPayload } from "../src/lib/qr-code";

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
const limitArg = getArg("limit");
const limit = limitArg !== undefined ? parseInt(limitArg, 10) : undefined;
const skipHeaderCheck = hasFlag("skip-header-check");

// ── Fixed paths (repo root is two levels up from apps/web) ───────────────────

const REPO_ROOT = path.resolve(process.cwd(), "../..");
const xlsxArg = getArg("xlsx");
const XLSX_PATH = xlsxArg
  ? path.resolve(REPO_ROOT, xlsxArg)
  : path.join(REPO_ROOT, "for_importation", "Masterlist.xlsx");

const WORKSHEET_NAME = "Master List";

// ── Cell coercion ─────────────────────────────────────────────────────────────

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
 * exceljs returns date-formatted cells as JS Date, Excel serial numbers, or
 * plain strings — String()-coercing a Date/serial produces unparseable junk
 * ("Mon Mar 12 2007…" / "38475") that normalizeDob silently rejects to NULL.
 */
function dobCellToString(value: ExcelJS.CellValue | undefined): string {
  if (value instanceof Date) return formatLocalDate(value);

  if (typeof value === "number") return excelSerialToDateString(value);

  if (typeof value === "string") {
    const trimmed = value.trim();
    // Numeric-looking string with no slashes (e.g. "38475") — treat as a
    // serial too; MM/DD/YYYY-style strings always contain "/" and pass
    // through unchanged to normalizeDob.
    if (trimmed !== "" && !trimmed.includes("/") && /^\d+(\.\d+)?$/.test(trimmed)) {
      return excelSerialToDateString(Number(trimmed));
    }
    return trimmed;
  }

  // Rich text / hyperlink / formula / other object shapes — fall back to the
  // generic coercion (covers formula results that resolve to a Date/number
  // only in the rare case; otherwise yields the same string as before).
  return cellValueToString(value);
}

// ── Header assertion (fail loud on a reshuffled spreadsheet) ─────────────────

/** Expected header label at each 1-indexed column position (index 0 unused). */
const EXPECTED_HEADERS: Readonly<Record<number, string>> = {
  1: "ID NUMBER",
  2: "FULL NAME",
  3: "DATE OF BIRTH",
  4: "ADDRESS",
  5: "SEX",
  6: "IMAGE",
  7: "SIGNATURE",
  8: "RSBSA #",
  9: "CATEGORY",
  10: "CONTACT NUMBER",
};

/** Normalizes a header label for tolerant comparison: trim, uppercase, collapse spaces, strip trailing #/.  */
function normalizeHeaderLabel(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/[#.]$/, "")
    .trim();
}

/**
 * Asserts row 1 of the worksheet matches the expected positional column
 * layout — fails loud on a reshuffled spreadsheet instead of silently
 * mis-mapping columns. Bypass with --skip-header-check.
 */
function assertHeaderLayout(headerRow: ExcelJS.Row): void {
  const values = headerRow.values as Array<ExcelJS.CellValue | undefined>;

  for (const [posStr, expected] of Object.entries(EXPECTED_HEADERS)) {
    const pos = Number(posStr);
    const actualRaw = cellValueToString(values[pos]);
    const actual = normalizeHeaderLabel(actualRaw);
    const expectedNorm = normalizeHeaderLabel(expected);

    if (actual !== expectedNorm) {
      throw new Error(
        `Header mismatch at column ${pos}: expected "${expected}", found "${actualRaw}". ` +
          "The masterlist columns may have been reshuffled — pass --skip-header-check to bypass.",
      );
    }
  }
}

// ── Masterlist parsing (fixed positional column mapping) ─────────────────────

async function parseMasterlist(xlsxPath: string): Promise<RawImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  const buf = fs.readFileSync(xlsxPath);

  // @ts-expect-error exceljs d.ts uses pre-TS5.7 unparameterized Buffer;
  // Buffer<ArrayBufferLike> is structurally compatible at runtime.
  await workbook.xlsx.load(buf);

  const worksheet = workbook.getWorksheet(WORKSHEET_NAME);
  if (!worksheet) {
    throw new Error(
      `Worksheet "${WORKSHEET_NAME}" not found in ${xlsxPath}`,
    );
  }

  if (!skipHeaderCheck) {
    const headerRow = worksheet.getRow(1);
    assertHeaderLayout(headerRow);
  }

  const rows: RawImportRow[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // header row

    const values = row.values as Array<ExcelJS.CellValue | undefined>;

    const idNumber = cellValueToString(values[1]);
    if (!idNumber) return; // skip rows with empty column A

    const fullName = cellValueToString(values[2]);
    const dateOfBirth = dobCellToString(values[3]);
    const address = cellValueToString(values[4]);
    const sex = cellValueToString(values[5]);
    // values[6] = IMAGE, values[7] = SIGNATURE — ignored (separate tool)
    const rsbsaNumber = cellValueToString(values[8]);
    const category = cellValueToString(values[9]);
    const contactNumber = cellValueToString(values[10]);

    rows.push({
      idNumber,
      fullName,
      dateOfBirth,
      address,
      sex,
      rsbsaNumber,
      category,
      contactNumber,
    });
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
  if (limit !== undefined) {
    console.log(`✂️   limit: ${limit} rows`);
  }

  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`❌  Masterlist not found: ${XLSX_PATH}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // ── Setup ────────────────────────────────────────────────────────────────

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug: tenantSlug },
      select: { id: true, barangayList: true, currentRegistrationYear: true },
    });
    const tenantId = tenant.id;
    console.log(`    tenant id: ${tenantId}\n`);

    const aliases = await prisma.barangayAlias.findMany({
      where: { tenantId },
      select: { fromLabel: true, toLabel: true },
    });
    const typoMap: Record<string, string> = {};
    for (const a of aliases) {
      typoMap[a.fromLabel] = a.toLabel;
    }

    const existingFisherfolk = await prisma.fisherfolk.findMany({
      where: { tenantId },
      select: { idNumber: true },
    });
    const existingIdNumbers = new Set(existingFisherfolk.map((f) => f.idNumber));

    const categoryRecords = await prisma.category.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const catMap = new Map<string, string>();
    for (const c of categoryRecords) {
      catMap.set(c.name.toLowerCase(), c.id);
    }

    // Resolve createdById: prefer the tenant owner, else any tenant user.
    let createdBy = await prisma.user.findFirst({
      where: { tenantId, role: "tenant_superadmin" },
      select: { id: true },
    });
    if (!createdBy) {
      createdBy = await prisma.user.findFirst({
        where: { tenantId },
        select: { id: true },
      });
    }
    if (!createdBy) {
      console.error(
        `❌  No user found for tenant ${tenantSlug} — cannot set createdById`,
      );
      process.exit(1);
    }
    const createdById = createdBy.id;
    console.log(`👤  createdById: ${createdById}\n`);

    // ── Parse ────────────────────────────────────────────────────────────────

    let rawRows = await parseMasterlist(XLSX_PATH);
    console.log(`📂  Parsed ${rawRows.length} rows from masterlist`);

    if (limit !== undefined) {
      rawRows = rawRows.slice(0, limit);
      console.log(`✂️   Limited to ${rawRows.length} rows`);
    }

    // ── Validate ─────────────────────────────────────────────────────────────

    const validationCtx: ValidationContext = {
      barangayList: tenant.barangayList,
      typoMap,
      existingIdNumbers,
    };
    const report = buildValidationReport(rawRows, validationCtx);

    const toImportRows: RowReport[] = report.rows.filter(
      (r) => r.status !== "error" && r.action === "import",
    );
    const skipExistingRows: RowReport[] = report.rows.filter(
      (r) => r.action === "skip-existing",
    );
    const invalidRows: RowReport[] = report.rows.filter(
      (r) =>
        r.action !== "skip-existing" &&
        (r.status === "error" ||
          r.action === "skip-duplicate" ||
          r.action === "skip-collision"),
    );

    console.log(
      `📋  parsed=${rawRows.length} toImport=${toImportRows.length} skipExisting=${skipExistingRows.length} invalid=${invalidRows.length}\n`,
    );

    // ── Import (insert-only, skip existing) ─────────────────────────────────

    let imported = 0;
    let skippedExisting = skipExistingRows.length;
    const skippedInvalid = invalidRows.length;
    let errors = 0;
    const importedList: string[] = [];

    for (const r of toImportRows) {
      const n = r.normalized;
      const idNumber = r.idNumber;

      const sexValue =
        n.sex == null ? null : n.sex === "Male" ? ("MALE" as const) : ("FEMALE" as const);

      const categoryIds = n.categories
        .map((c) => catMap.get(c.toLowerCase()))
        .filter((id): id is string => id != null);

      if (dry) {
        imported++;
        importedList.push(`${idNumber}|${n.fullName}`);
        continue;
      }

      try {
        const createData = omitUndefined({
          tenantId,
          idNumber,
          fullName: n.fullName,
          lastName: n.lastName,
          firstName: n.firstName,
          middleName: n.middleName ?? undefined,
          dateOfBirth: n.dateOfBirth ? new Date(n.dateOfBirth) : null,
          sex: sexValue,
          address: n.address || "",
          barangay: n.barangay ?? "",
          contactNumber: n.contactNumber ?? undefined,
          rsbsaNumber: n.rsbsaNumber ?? undefined,
          categoryIds,
          remarks: n.remarks ?? undefined,
          status: "ACTIVE" as const,
          registrationYear: tenant.currentRegistrationYear,
          createdById,
          updatedById: createdById,
        });

        const created = await prisma.fisherfolk.create({
          data: createData as Prisma.FisherfolkUncheckedCreateInput,
        });

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

        imported++;
        importedList.push(`${idNumber}|${n.fullName}`);
      } catch (err: unknown) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          // Unique-constraint race — idNumber already exists. Idempotent skip.
          skippedExisting++;
          continue;
        }
        errors++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ [import] ${idNumber}: ${msg}`);
      }
    }

    // ── Summary ──────────────────────────────────────────────────────────────

    console.log("📋  SUMMARY");
    console.log(`    tenant           : ${tenantSlug}`);
    console.log(`    parsed           : ${rawRows.length}`);
    console.log(`    ${dry ? "wouldImport" : "imported"}      : ${imported}`);
    console.log(`    skippedExisting  : ${skippedExisting}`);
    console.log(`    skippedInvalid   : ${skippedInvalid}`);
    console.log(`    errors           : ${errors}`);

    if (invalidRows.length > 0) {
      console.log("\n⚠️   Invalid / rejected rows:");
      for (const r of invalidRows) {
        const reasons = r.errors.length > 0 ? r.errors : r.warnings;
        console.log(
          `    row ${r.rowIndex} [${r.idNumber || "(no id)"}] action=${r.action}: ${reasons.join("; ")}`,
        );
      }
    }

    if (dry) {
      console.log(
        `\n🔍  DRY RUN — no DB writes performed. ${importedList.length} rows would be imported:`,
      );
      for (const line of importedList) {
        console.log(`    ${line}`);
      }
      console.log("\n   Re-run with --confirm to perform the import.");
    } else {
      console.log("\n✅  Import complete.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("❌  Fatal:", err);
  process.exit(1);
});
