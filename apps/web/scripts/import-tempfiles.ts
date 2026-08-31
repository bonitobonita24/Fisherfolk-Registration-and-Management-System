#!/usr/bin/env tsx
/**
 * import-tempfiles.ts — CLI script to import the 15 fisherfolk from the
 * `.tempfiles/` masterlist Excel export, link their photo/signature assets,
 * and backfill missing assets (`missingpix/`) onto already-existing records
 * WITHOUT ever overwriting an asset a record already has.
 *
 * Usage (run from apps/web):
 *   pnpm exec tsx scripts/import-tempfiles.ts [--tenant calapan-city] \
 *     [--dir <folder>] [--xlsx <name>] [--dry]
 *
 * Input paths resolve under a base folder (default ".tempfiles" at repo root;
 * override with --dir, absolute or repo-root-relative — this script runs from
 * apps/web, so repo root is two levels up):
 *   masterlist  : <dir>/Complete Masterlist.xlsx  (or first *.xlsx, or --xlsx)
 *   photos      : <dir>/PHOTO
 *   signatures  : <dir>/SIGNATURE
 *   missing pix : <dir>/missingpix/PHOTO
 *   missing sig : <dir>/missingpix/SIGNATURE
 *
 * Three phases, always in this order:
 *   Phase 1 — INCREMENTAL upsert of the masterlist rows (mirrors the
 *             INCREMENTAL commit branch in src/server/trpc/routers/import.ts).
 *   Phase 2 — link masterlist photo/signature files onto the just-imported
 *             idNumbers (overwrite allowed — these are the authoritative
 *             new records).
 *   Phase 3 — backfill missingpix/ assets onto EXISTING records, but ONLY
 *             when that record's photo/signature column is currently
 *             null/empty (fill-only-if-null guard — never overwrites an
 *             asset a record already has).
 *
 * --dry performs NO uploads and NO DB writes — only computes + prints what
 * would happen.
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

import { PrismaClient, type Prisma } from "@frms/db";
import { parseImportWorkbook } from "../src/lib/import/excel";
import {
  buildValidationReport,
  type ValidationContext,
  type RowReport,
} from "../src/lib/import/validate";
import { compressImageToUnder } from "../src/lib/import/asset-storage";
import { uploadFile, TelegramAdapter, getStorageBackend } from "@frms/storage";
import { omitUndefined } from "../src/server/lib/prisma-input";
import { buildQRPayload } from "../src/lib/qr-code";

/**
 * Compress + upload a fisherfolk asset AND (on the telegram backend) write its
 * media_objects ledger row.
 *
 * Correction over the bare `storeImportedAsset` helper: that helper calls the
 * S3/MinIO `uploadFile` and never touches the ledger, so under
 * STORAGE_BACKEND=telegram it (a) uploads to the wrong backend and (b) leaves
 * no ledger row — and the app's /api/media proxy resolves a telegram key via
 * media_objects (tenantId + storageKey → telegramFileId), so the image 404s.
 * Here we mirror the canonical write path (src/server/trpc/routers/upload.ts +
 * scripts/upload-local-assets.ts): on telegram, upload via TelegramAdapter and
 * upsert the ledger row from the result's telegram fields; on minio/s3, keep
 * the plain uploadFile path (served via presigned URLs — no ledger needed).
 * Returns the storage key written onto the fisherfolk record.
 */
async function storeAssetWithLedger(
  prisma: PrismaClient,
  chatId: string,
  params: {
    tenantId: string;
    idNumber: string;
    kind: "photo" | "signature";
    buffer: Buffer;
    originalFilename: string;
  },
): Promise<string> {
  const { tenantId, kind, buffer, originalFilename } = params;
  const entityType =
    kind === "photo" ? "fisherfolk-photo" : "fisherfolk-signature";

  const { buffer: compressed, mimeType } = await compressImageToUnder(buffer);

  if (getStorageBackend() === "telegram") {
    if (chatId === "") {
      throw new Error(
        "telegram backend requires a chatId (tenant.telegramChannelId ?? TELEGRAM_DEFAULT_CHANNEL_ID)",
      );
    }
    const res = await new TelegramAdapter().upload({
      tenantId,
      entityType,
      originalFilename,
      mimeType,
      buffer: compressed,
      chatId,
    });
    const ledger = {
      entityType,
      backend: "telegram",
      telegramChatId: res.telegramChatId ?? chatId,
      telegramFileId: res.telegramFileId ?? null,
      telegramMessageId:
        res.telegramMessageId != null ? BigInt(res.telegramMessageId) : null,
      sizeBytes: compressed.length,
      mimeType,
      migratedAt: new Date(),
    };
    await prisma.mediaObject.upsert({
      where: { tenantId_storageKey: { tenantId, storageKey: res.key } },
      create: { tenantId, storageKey: res.key, ...ledger },
      update: ledger,
    });
    return res.key;
  }

  const res = await uploadFile({
    tenantId,
    entityType,
    originalFilename,
    mimeType,
    buffer: compressed,
  });
  return res.key;
}

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

const tenantSlug = getArg("tenant") ?? "calapan-city";
const dry = hasFlag("dry");

// ── Fixed paths (repo root is two levels up from apps/web) ───────────────────

const REPO_ROOT = path.resolve(process.cwd(), "../..");

// Base folder holding the masterlist + PHOTO/ + SIGNATURE/ (+ optional
// missingpix/). Override with --dir <path> (absolute, or relative to repo
// root); defaults to the legacy ".tempfiles" location for backward compat.
const dirArg = getArg("dir");
const BASE_DIR = dirArg
  ? path.isAbsolute(dirArg)
    ? dirArg
    : path.join(REPO_ROOT, dirArg)
  : path.join(REPO_ROOT, ".tempfiles");

/**
 * Resolve the masterlist workbook inside BASE_DIR. Prefers an explicit
 * --xlsx <name>, then the canonical "Complete Masterlist.xlsx", then the
 * first *.xlsx found (case-insensitive). Worksheet parsed is always the
 * first sheet (see parseImportWorkbook).
 */
function resolveMasterlistPath(): string {
  const explicit = getArg("xlsx");
  if (explicit) {
    return path.isAbsolute(explicit) ? explicit : path.join(BASE_DIR, explicit);
  }
  const canonical = path.join(BASE_DIR, "Complete Masterlist.xlsx");
  if (fs.existsSync(canonical)) return canonical;
  try {
    const firstXlsx = fs
      .readdirSync(BASE_DIR)
      .filter((n) => n.toLowerCase().endsWith(".xlsx") && !n.startsWith("~$"))
      .sort()[0];
    if (firstXlsx) return path.join(BASE_DIR, firstXlsx);
  } catch {
    /* dir missing — fall through to canonical (existence checked in main) */
  }
  return canonical;
}

const MASTERLIST_PATH = resolveMasterlistPath();
const PHOTOS_DIR = path.join(BASE_DIR, "PHOTO");
const SIGS_DIR = path.join(BASE_DIR, "SIGNATURE");
const MISSING_PHOTOS_DIR = path.join(BASE_DIR, "missingpix", "PHOTO");
const MISSING_SIGS_DIR = path.join(BASE_DIR, "missingpix", "SIGNATURE");

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a case-insensitive `idNumber (upper, no extension) → filename` map
 * for a directory. Skips Thumbs.db and non-file entries. Returns an empty
 * map (no error) when the directory does not exist.
 */
function buildFilenameMap(dir: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(dir)) return map;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name.toLowerCase() === "thumbs.db") continue;
    const ext = path.extname(entry.name);
    const base = entry.name.slice(0, entry.name.length - ext.length);
    map.set(base.toUpperCase(), entry.name);
  }
  return map;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`🏢  Tenant: ${tenantSlug}`);
  console.log(`📄  Masterlist: ${MASTERLIST_PATH}`);
  if (dry) {
    console.log("🔍  DRY RUN — no uploads or DB writes");
  }

  const prisma = new PrismaClient();

  try {
    // ── Setup (once) ─────────────────────────────────────────────────────────

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug: tenantSlug },
      select: { id: true, barangayList: true, currentRegistrationYear: true, telegramChannelId: true },
    });
    const tenantId = tenant.id;
    // Telegram channel for asset uploads: per-tenant override, else the env
    // default. Only required when STORAGE_BACKEND=telegram (guarded in
    // storeAssetWithLedger); minio/s3 ignore it.
    const chatId =
      tenant.telegramChannelId ??
      process.env["TELEGRAM_DEFAULT_CHANNEL_ID"] ??
      "";
    console.log(
      `🗄️  Storage backend: ${getStorageBackend()}${getStorageBackend() === "telegram" ? ` (chat ${chatId || "MISSING"})` : ""}`,
    );
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
      select: { id: true, idNumber: true, photo: true, signature: true },
    });
    type FFRecord = { id: string; photo: string | null; signature: string | null };
    let idMap = new Map<string, FFRecord>(
      existingFisherfolk.map((f) => [
        f.idNumber,
        { id: f.id, photo: f.photo, signature: f.signature },
      ]),
    );
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

    // ══════════════════════════════════════════════════════════════════════
    // PHASE 1 — masterlist INCREMENTAL upsert
    // ══════════════════════════════════════════════════════════════════════

    console.log("── PHASE 1: masterlist import (INCREMENTAL upsert) ──────────");

    if (!fs.existsSync(MASTERLIST_PATH)) {
      console.error(`❌  Masterlist not found: ${MASTERLIST_PATH}`);
      process.exit(1);
    }

    const workbookBuffer = fs.readFileSync(MASTERLIST_PATH);
    const { rows, headerWarnings } = await parseImportWorkbook(workbookBuffer);
    for (const w of headerWarnings) {
      console.warn(`  ⚠ header: ${w}`);
    }
    console.log(`  📂  Parsed ${rows.length} rows from masterlist`);

    const validationCtx: ValidationContext = {
      barangayList: tenant.barangayList,
      typoMap,
      existingIdNumbers,
    };
    const report = buildValidationReport(rows, validationCtx);

    const importableRows: RowReport[] = report.rows.filter((r) => {
      if (r.status === "error") return false;
      return r.action === "import" || r.action === "skip-existing";
    });

    console.log(
      `  📋  ${importableRows.length} importable rows (of ${rows.length}); ${report.counts.error} error rows`,
    );

    let p1Imported = 0;
    let p1Updated = 0;
    let p1Skipped = 0;
    let p1Errors = 0;
    const masterlistIdNumbers: string[] = [];

    for (const r of importableRows) {
      const n = r.normalized;
      const idNumber = r.idNumber;
      if (!idNumber) {
        p1Skipped++;
        continue;
      }

      const sexValue =
        n.sex == null ? null : n.sex === "Male" ? ("MALE" as const) : ("FEMALE" as const);

      const categoryIds = n.categories
        .map((c) => catMap.get(c.toLowerCase()))
        .filter((id): id is string => id != null);

      const wasExisting = existingIdNumbers.has(idNumber);

      if (dry) {
        masterlistIdNumbers.push(idNumber);
        if (wasExisting) p1Updated++;
        else p1Imported++;
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
          status: "NEW" as const,
          registrationYear: tenant.currentRegistrationYear,
          createdById,
          updatedById: createdById,
        });

        const updateData = omitUndefined({
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
          status: "NEW" as const,
          registrationYear: tenant.currentRegistrationYear,
          updatedById: createdById,
        });

        const result = await prisma.fisherfolk.upsert({
          where: { tenantId_idNumber: { tenantId, idNumber } },
          create: createData as Prisma.FisherfolkUncheckedCreateInput,
          update: updateData as Prisma.FisherfolkUncheckedUpdateInput,
        });

        await prisma.fisherfolk.update({
          where: { id: result.id },
          data: {
            qrCode: buildQRPayload({
              id: result.id,
              regNo: result.idNumber,
              tenantId,
            }),
          },
        });

        masterlistIdNumbers.push(idNumber);

        if (wasExisting) {
          p1Updated++;
        } else {
          p1Imported++;
        }
      } catch (err: unknown) {
        p1Errors++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ [import] ${idNumber}: ${msg}`);
      }
    }

    console.log(
      `  ✅  Phase 1 done: imported=${p1Imported} updated=${p1Updated} skipped=${p1Skipped} errors=${p1Errors}\n`,
    );

    // Refresh idMap after Phase 1 writes so Phase 2/3 see current DB state.
    if (!dry) {
      const refreshed = await prisma.fisherfolk.findMany({
        where: { tenantId },
        select: { id: true, idNumber: true, photo: true, signature: true },
      });
      idMap = new Map<string, FFRecord>(
        refreshed.map((f) => [
          f.idNumber,
          { id: f.id, photo: f.photo, signature: f.signature },
        ]),
      );
    }

    // ══════════════════════════════════════════════════════════════════════
    // PHASE 2 — link masterlist assets (overwrite allowed)
    // ══════════════════════════════════════════════════════════════════════

    console.log("── PHASE 2: link masterlist photo/signature assets ──────────");

    const photoMap = buildFilenameMap(PHOTOS_DIR);
    const sigMap = buildFilenameMap(SIGS_DIR);
    console.log(
      `  📁  ${photoMap.size} photo files in ${PHOTOS_DIR}, ${sigMap.size} signature files in ${SIGS_DIR}`,
    );

    let p2PhotosLinked = 0;
    let p2SigsLinked = 0;
    let p2MissingFile = 0;
    let p2Errors = 0;

    for (const idNumber of masterlistIdNumbers) {
      const key = idNumber.toUpperCase();
      const photoFilename = photoMap.get(key);
      const sigFilename = sigMap.get(key);

      let photoKey: string | undefined;
      let sigKey: string | undefined;

      if (photoFilename === undefined) {
        p2MissingFile++;
      } else if (dry) {
        p2PhotosLinked++;
      } else {
        try {
          const buffer = fs.readFileSync(path.join(PHOTOS_DIR, photoFilename));
          photoKey = await storeAssetWithLedger(prisma, chatId, {
            tenantId,
            idNumber,
            kind: "photo",
            buffer,
            originalFilename: photoFilename,
          });
          p2PhotosLinked++;
        } catch (err: unknown) {
          p2Errors++;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  ✗ [photo] ${idNumber}: ${msg}`);
        }
      }

      if (sigFilename === undefined) {
        p2MissingFile++;
      } else if (dry) {
        p2SigsLinked++;
      } else {
        try {
          const buffer = fs.readFileSync(path.join(SIGS_DIR, sigFilename));
          sigKey = await storeAssetWithLedger(prisma, chatId, {
            tenantId,
            idNumber,
            kind: "signature",
            buffer,
            originalFilename: sigFilename,
          });
          p2SigsLinked++;
        } catch (err: unknown) {
          p2Errors++;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  ✗ [sig] ${idNumber}: ${msg}`);
        }
      }

      if (!dry && (photoKey !== undefined || sigKey !== undefined)) {
        try {
          await prisma.fisherfolk.update({
            where: { tenantId_idNumber: { tenantId, idNumber } },
            data: {
              ...(photoKey !== undefined ? { photo: photoKey } : {}),
              ...(sigKey !== undefined ? { signature: sigKey } : {}),
            },
          });
        } catch (err: unknown) {
          p2Errors++;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  ✗ [db-update] ${idNumber}: ${msg}`);
        }
      }
    }

    console.log(
      `  ✅  Phase 2 done: photosLinked=${p2PhotosLinked} sigsLinked=${p2SigsLinked} missingFile=${p2MissingFile} errors=${p2Errors}\n`,
    );

    // Refresh idMap again after Phase 2 writes so Phase 3's null-guard sees
    // current photo/signature state (masterlist records now have assets).
    if (!dry) {
      const refreshed = await prisma.fisherfolk.findMany({
        where: { tenantId },
        select: { id: true, idNumber: true, photo: true, signature: true },
      });
      idMap = new Map<string, FFRecord>(
        refreshed.map((f) => [
          f.idNumber,
          { id: f.id, photo: f.photo, signature: f.signature },
        ]),
      );
    }

    // ══════════════════════════════════════════════════════════════════════
    // PHASE 3 — missingpix BACKFILL onto existing records (fill-only-if-null)
    // ══════════════════════════════════════════════════════════════════════

    console.log(
      "── PHASE 3: missingpix backfill (fill-only-if-null, never overwrite) ──",
    );

    const missingPhotoMap = buildFilenameMap(MISSING_PHOTOS_DIR);
    const missingSigMap = buildFilenameMap(MISSING_SIGS_DIR);
    console.log(
      `  📁  ${missingPhotoMap.size} photo files in ${MISSING_PHOTOS_DIR}, ${missingSigMap.size} signature files in ${MISSING_SIGS_DIR}`,
    );

    const targetIdNumbers = new Set<string>([
      ...missingPhotoMap.keys(),
      ...missingSigMap.keys(),
    ]);

    let p3PhotosBackfilled = 0;
    let p3SigsBackfilled = 0;
    let p3PhotoSkippedExisting = 0;
    let p3SigSkippedExisting = 0;
    let p3PhotoNoFile = 0;
    let p3SigNoFile = 0;
    let p3RecordNotFound = 0;
    let p3Errors = 0;

    for (const key of targetIdNumbers) {
      // idMap is keyed by the DB's idNumber casing; the filename map key is
      // already upper-cased. DB idNumbers are compared case-insensitively by
      // finding the matching entry.
      let record: FFRecord | undefined;
      let dbIdNumber: string | undefined;
      for (const [idNum, rec] of idMap) {
        if (idNum.toUpperCase() === key) {
          record = rec;
          dbIdNumber = idNum;
          break;
        }
      }

      if (record === undefined || dbIdNumber === undefined) {
        p3RecordNotFound++;
        continue;
      }

      const photoFilename = missingPhotoMap.get(key);
      const sigFilename = missingSigMap.get(key);

      let photoKey: string | undefined;
      let sigKey: string | undefined;

      // ── PHOTO — fill only if currently null/empty ───────────────────────
      if (photoFilename === undefined) {
        p3PhotoNoFile++;
      } else if (record.photo != null && record.photo !== "") {
        p3PhotoSkippedExisting++;
      } else if (dry) {
        p3PhotosBackfilled++;
      } else {
        try {
          const buffer = fs.readFileSync(
            path.join(MISSING_PHOTOS_DIR, photoFilename),
          );
          photoKey = await storeAssetWithLedger(prisma, chatId, {
            tenantId,
            idNumber: dbIdNumber,
            kind: "photo",
            buffer,
            originalFilename: photoFilename,
          });
          p3PhotosBackfilled++;
        } catch (err: unknown) {
          p3Errors++;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  ✗ [photo-backfill] ${dbIdNumber}: ${msg}`);
        }
      }

      // ── SIGNATURE — fill only if currently null/empty ───────────────────
      if (sigFilename === undefined) {
        p3SigNoFile++;
      } else if (record.signature != null && record.signature !== "") {
        p3SigSkippedExisting++;
      } else if (dry) {
        p3SigsBackfilled++;
      } else {
        try {
          const buffer = fs.readFileSync(
            path.join(MISSING_SIGS_DIR, sigFilename),
          );
          sigKey = await storeAssetWithLedger(prisma, chatId, {
            tenantId,
            idNumber: dbIdNumber,
            kind: "signature",
            buffer,
            originalFilename: sigFilename,
          });
          p3SigsBackfilled++;
        } catch (err: unknown) {
          p3Errors++;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  ✗ [sig-backfill] ${dbIdNumber}: ${msg}`);
        }
      }

      if (!dry && (photoKey !== undefined || sigKey !== undefined)) {
        try {
          await prisma.fisherfolk.update({
            where: { tenantId_idNumber: { tenantId, idNumber: dbIdNumber } },
            data: {
              ...(photoKey !== undefined ? { photo: photoKey } : {}),
              ...(sigKey !== undefined ? { signature: sigKey } : {}),
            },
          });
        } catch (err: unknown) {
          p3Errors++;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  ✗ [db-update-backfill] ${dbIdNumber}: ${msg}`);
        }
      }
    }

    console.log(
      `  ✅  Phase 3 done: photosBackfilled=${p3PhotosBackfilled} sigsBackfilled=${p3SigsBackfilled} photoSkippedExisting=${p3PhotoSkippedExisting} sigSkippedExisting=${p3SigSkippedExisting} recordNotFound=${p3RecordNotFound} errors=${p3Errors}\n`,
    );

    // ══════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ══════════════════════════════════════════════════════════════════════

    console.log("📋  SUMMARY");
    console.log(`    tenant                    : ${tenantSlug}`);
    console.log("    — Phase 1 (masterlist import) —");
    console.log(`      imported                : ${p1Imported}`);
    console.log(`      updated                 : ${p1Updated}`);
    console.log(`      skipped                 : ${p1Skipped}`);
    console.log(`      errors                  : ${p1Errors}`);
    console.log("    — Phase 2 (masterlist assets) —");
    console.log(`      photos linked           : ${p2PhotosLinked}`);
    console.log(`      signatures linked       : ${p2SigsLinked}`);
    console.log(`      missing file            : ${p2MissingFile}`);
    console.log(`      errors                  : ${p2Errors}`);
    console.log("    — Phase 3 (missingpix backfill) —");
    console.log(`      photos backfilled       : ${p3PhotosBackfilled}`);
    console.log(`      signatures backfilled   : ${p3SigsBackfilled}`);
    console.log(`      photo skipped (has one) : ${p3PhotoSkippedExisting}`);
    console.log(`      sig skipped (has one)   : ${p3SigSkippedExisting}`);
    console.log(`      record not found        : ${p3RecordNotFound}`);
    console.log(`      errors                  : ${p3Errors}`);

    if (dry) {
      console.log("\n🔍  DRY RUN — no uploads or DB writes performed.");
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
