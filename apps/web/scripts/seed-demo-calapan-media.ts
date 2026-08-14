#!/usr/bin/env tsx
/**
 * seed-demo-calapan-media.ts — Attach media to the DEMO tenant's blank
 * vessels/violations/ayuda programs/kanban tasks so no screen shows an
 * empty-image state.
 *
 * Uploads a small fixed set of bundled demo asset files (packages/db/demo-assets/)
 * to Telegram ONCE each (same helper + MediaObject ledger pattern as
 * apps/web/scripts/seed-demo-calapan.ts), then attaches the resulting storage
 * keys to every target record that currently has none:
 *   - Vessel.vesselPhoto (null → boat photo key)
 *   - Violation.evidenceImages (empty → 1-2 keys) + one ViolationAttachment
 *     (violation-report.pdf)
 *   - AyudaProgram → one AyudaUpload EVENT_PHOTO + one AyudaUpload SIGNED_SHEET
 *     (only if the program has no uploads yet)
 *   - KanbanTask → one KanbanAttachment (only if the task has none yet)
 *
 * Idempotent: only touches records with no existing media; re-running does
 * not duplicate MediaObjects (upsert by tenantId+storageKey) or attachment
 * rows for records that already have one.
 *
 * NEVER touches the real `calapan-city` tenant — everything is scoped to the
 * tenant resolved via --tenant.
 *
 * Usage (from apps/web, after loading env):
 *   set -a; . ./.env.dev; set +a
 *   ALLOW_DEMO_SEED=1 pnpm exec tsx scripts/seed-demo-calapan-media.ts \
 *     [--tenant <slug>]   (default: "calapan-demo")
 *     [--seed <n>]        (default: 9191)
 *
 * Required env: DATABASE_URL, STORAGE_BACKEND=telegram, TELEGRAM_BOT_TOKEN,
 * TELEGRAM_DEFAULT_CHANNEL_ID (used unless the tenant's own telegramChannelId
 * is set).
 */

import dns from "node:dns";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Force IPv4 first — WSL2 lesson (node.fetch.wsl2-ipv6-etimedout).
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* older Node without setDefaultResultOrder — best effort only */
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for parity with sibling scripts / future fetch use
const ipv4Agent = new https.Agent({ family: 4 });

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
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* file absent — skip */
  }
}
loadEnvFile(path.resolve(process.cwd(), "../../.env.dev"));
loadEnvFile(path.resolve(process.cwd(), "../../.env"));

// ── HARD GUARD — dummy/demo data is for DEV + DEMO ONLY ──────────────────────
// Mirrors apps/web/scripts/seed-demo-calapan-extras.ts (docs/DATA_SEEDING_POLICY.md,
// owner-set 2026-07-08). Refuses to run unless ALLOW_DEMO_SEED is explicitly set.
if (
  process.env["ALLOW_DEMO_SEED"] !== "1" &&
  process.env["ALLOW_DEMO_SEED"] !== "true"
) {
  console.error(
    "❌ REFUSED: seed-demo-calapan-media.ts writes DUMMY/DEMO media (vessel photos,\n" +
      "   violation evidence, ayuda uploads, kanban attachments). Policy\n" +
      "   (docs/DATA_SEEDING_POLICY.md): demo data is for LOCAL DEV + the DEMO stack\n" +
      "   ONLY — NEVER staging or production. Re-run with ALLOW_DEMO_SEED=1 only when\n" +
      "   the target DB is local dev or the demo stack.",
  );
  process.exit(1);
}

import { PrismaClient } from "@frms/db";
import {
  generateStorageKey,
  getTelegramBotToken,
  uploadDocumentToTelegram,
} from "@frms/storage";

// ESM-safe __dirname (for the bundled demo-asset files).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEMO_ASSETS_DIR = path.resolve(__dirname, "..", "..", "..", "packages", "db", "demo-assets");

// ── CLI args ─────────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = rawArgs.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  const next = rawArgs[idx + 1];
  return typeof next === "string" && !next.startsWith("--") ? next : undefined;
}
function intArg(name: string, def: number): number {
  const v = getArg(name);
  return v !== undefined && /^\d+$/.test(v) ? parseInt(v, 10) : def;
}

const TENANT_SLUG = getArg("tenant") ?? "calapan-demo";
const RNG_SEED = intArg("seed", 9191);

// ── Deterministic RNG (mulberry32) — mirrors seed-demo-calapan.ts ────────────
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
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]!;

// ── Demo asset pool — bundled files uploaded ONCE each ────────────────────────
const MIME_BY_EXT: Readonly<Record<string, string>> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};
function mimeForFile(filePath: string): string {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

interface DemoAsset {
  readonly key: "vesselPhoto" | "violationBoat" | "violationNet" | "ayudaEventPhoto" | "ayudaSignedSheet" | "kanbanAttachment" | "kanbanSpec" | "violationReport";
  readonly filename: string;
  readonly entityType: string;
}

const DEMO_ASSET_MANIFEST: readonly DemoAsset[] = [
  { key: "vesselPhoto", filename: "vessel-photo-bangka.png", entityType: "vessel-photo" },
  { key: "violationBoat", filename: "violation-evidence-boat.jpg", entityType: "violation-evidence" },
  { key: "violationNet", filename: "violation-evidence-net.png", entityType: "violation-evidence" },
  { key: "ayudaEventPhoto", filename: "ayuda-event-photo.png", entityType: "ayuda-event-photo" },
  { key: "ayudaSignedSheet", filename: "ayuda-signed-sheet.pdf", entityType: "ayuda-signed-sheet" },
  { key: "kanbanAttachment", filename: "kanban-attachment-site.png", entityType: "kanban-attachment" },
  { key: "kanbanSpec", filename: "kanban-spec.pdf", entityType: "kanban-attachment" },
  { key: "violationReport", filename: "violation-report.pdf", entityType: "violation-attachment" },
];

interface UploadedAsset {
  readonly storageKey: string;
  readonly originalFilename: string;
  readonly fileSize: number;
  readonly mimeType: string;
}

// ── Prisma + storage ───────────────────────────────────────────────────────
const prisma = new PrismaClient();

async function uploadAsset(
  tenantId: string,
  chatId: string,
  botToken: string,
  asset: DemoAsset,
): Promise<UploadedAsset | null> {
  const filePath = path.join(DEMO_ASSETS_DIR, asset.filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠  Missing demo asset "${asset.filename}" — skipping ${asset.key}.`);
    return null;
  }

  const stat = fs.statSync(filePath);
  const mimeType = mimeForFile(filePath);
  const buffer = fs.readFileSync(filePath);
  const storageKey = generateStorageKey(tenantId, asset.entityType, asset.filename);

  const { messageId, fileId } = await uploadDocumentToTelegram({
    botToken,
    chatId,
    bytes: new Uint8Array(buffer),
    filename: asset.filename,
    mimeType,
    caption: `${tenantId} · ${asset.entityType} · ${storageKey}`,
    maxRetries: 10,
  });

  const mediaObjectFields = {
    entityType: asset.entityType,
    backend: "telegram",
    telegramChatId: chatId,
    telegramFileId: fileId,
    telegramMessageId: BigInt(messageId),
    sizeBytes: stat.size,
    mimeType,
    migratedAt: new Date(),
  };

  await prisma.mediaObject.upsert({
    where: { tenantId_storageKey: { tenantId, storageKey } },
    create: { tenantId, storageKey, ...mediaObjectFields },
    update: mediaObjectFields,
  });

  return {
    storageKey,
    originalFilename: asset.filename,
    fileSize: stat.size,
    mimeType,
  };
}

// ── main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(`🌱 Attaching demo media for tenant "${TENANT_SLUG}"...`);

  const tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (!tenant) {
    throw new Error(`Tenant "${TENANT_SLUG}" not found — run seed-demo-calapan.ts / seed-demo.ts first.`);
  }
  const tenantId = tenant.id;

  const chatId = tenant.telegramChannelId ?? process.env["TELEGRAM_DEFAULT_CHANNEL_ID"] ?? "";
  if (chatId === "") {
    throw new Error(
      "Missing Telegram chat id — set tenant.telegramChannelId or TELEGRAM_DEFAULT_CHANNEL_ID.",
    );
  }
  const botToken = getTelegramBotToken();

  // A demo user to attribute uploaded-by relations to — prefer an encoder,
  // fall back to any tenant user.
  const demoUser =
    (await prisma.user.findFirst({ where: { tenantId, role: "encoder" } })) ??
    (await prisma.user.findFirst({ where: { tenantId } }));
  if (!demoUser) {
    throw new Error(`No users found for tenant "${TENANT_SLUG}" — run seed-demo-calapan.ts first.`);
  }

  // ── 1. Upload each bundled demo asset ONCE ──────────────────────────────
  console.log("ℹ  Uploading demo asset pool...");
  const uploaded = new Map<DemoAsset["key"], UploadedAsset>();
  for (const asset of DEMO_ASSET_MANIFEST) {
    const result = await uploadAsset(tenantId, chatId, botToken, asset);
    if (result) {
      uploaded.set(asset.key, result);
      console.log(`  ✅ ${asset.filename} → ${result.storageKey}`);
    }
  }

  const vesselPhoto = uploaded.get("vesselPhoto");
  const violationBoat = uploaded.get("violationBoat");
  const violationNet = uploaded.get("violationNet");
  const ayudaEventPhoto = uploaded.get("ayudaEventPhoto");
  const ayudaSignedSheet = uploaded.get("ayudaSignedSheet");
  const kanbanAttachment = uploaded.get("kanbanAttachment");
  const violationReport = uploaded.get("violationReport");
  const evidencePool = [violationBoat, violationNet].filter((a): a is UploadedAsset => a !== undefined);

  // ── 2. Vessels — set vesselPhoto where null ─────────────────────────────
  let vesselsUpdated = 0;
  if (vesselPhoto) {
    const blankVessels = await prisma.vessel.findMany({
      where: { tenantId, vesselPhoto: null },
      select: { id: true },
    });
    for (const vessel of blankVessels) {
      await prisma.vessel.update({
        where: { id: vessel.id },
        data: { vesselPhoto: vesselPhoto.storageKey },
      });
      vesselsUpdated++;
    }
  } else {
    console.warn("  ⚠  vessel-photo-bangka.png missing — vessels left unchanged.");
  }
  console.log(`  ✅ Vessels: ${vesselsUpdated} photo(s) attached.`);

  // ── 3. Violations — evidenceImages + ViolationAttachment ────────────────
  let violationsUpdated = 0;
  let violationAttachmentsCreated = 0;
  if (evidencePool.length > 0) {
    // NOTE: Prisma `{ isEmpty: true }` matches an empty array [] but NOT a NULL
    // scalar-list column. seed-demo.ts creates violations without setting
    // evidenceImages, so the column is NULL and isEmpty misses them. Fetch all
    // and filter by length in JS so both NULL and [] are treated as blank.
    const allViolations = await prisma.violation.findMany({
      where: { tenantId },
      select: { id: true, evidenceImages: true },
    });
    const blankViolations = allViolations.filter(
      (v) => !Array.isArray(v.evidenceImages) || v.evidenceImages.length === 0,
    );
    for (const violation of blankViolations) {
      const n = evidencePool.length >= 2 && rng() < 0.5 ? 2 : 1;
      const keys = n === 2 ? evidencePool.map((a) => a.storageKey) : [pick(evidencePool).storageKey];
      await prisma.violation.update({
        where: { id: violation.id },
        data: { evidenceImages: keys },
      });
      violationsUpdated++;

      if (violationReport) {
        const existingAttachment = await prisma.violationAttachment.findFirst({
          where: { violationId: violation.id },
          select: { id: true },
        });
        if (!existingAttachment) {
          await prisma.violationAttachment.create({
            data: {
              violationId: violation.id,
              filePath: violationReport.storageKey,
              originalFilename: violationReport.originalFilename,
              mimeType: violationReport.mimeType,
              fileSize: violationReport.fileSize,
              uploadedById: demoUser.id,
            },
          });
          violationAttachmentsCreated++;
        }
      }
    }
  } else {
    console.warn("  ⚠  No violation evidence assets uploaded — violations left unchanged.");
  }
  console.log(
    `  ✅ Violations: ${violationsUpdated} evidenceImages set, ${violationAttachmentsCreated} attachment(s) created.`,
  );

  // ── 4. Ayuda programs — EVENT_PHOTO + SIGNED_SHEET uploads ──────────────
  let ayudaUploadsCreated = 0;
  const ayudaPrograms = await prisma.ayudaProgram.findMany({
    where: { tenantId },
    select: { id: true },
  });
  for (const program of ayudaPrograms) {
    const existingUploads = await prisma.ayudaUpload.count({ where: { programId: program.id } });
    if (existingUploads > 0) continue;

    if (ayudaEventPhoto) {
      await prisma.ayudaUpload.create({
        data: {
          programId: program.id,
          uploadType: "EVENT_PHOTO",
          filePath: ayudaEventPhoto.storageKey,
          originalFilename: ayudaEventPhoto.originalFilename,
          fileSize: ayudaEventPhoto.fileSize,
          mimeType: ayudaEventPhoto.mimeType,
          uploadedById: demoUser.id,
        },
      });
      ayudaUploadsCreated++;
    }
    if (ayudaSignedSheet) {
      await prisma.ayudaUpload.create({
        data: {
          programId: program.id,
          uploadType: "SIGNED_SHEET",
          filePath: ayudaSignedSheet.storageKey,
          originalFilename: ayudaSignedSheet.originalFilename,
          fileSize: ayudaSignedSheet.fileSize,
          mimeType: ayudaSignedSheet.mimeType,
          uploadedById: demoUser.id,
        },
      });
      ayudaUploadsCreated++;
    }
  }
  console.log(`  ✅ Ayuda programs: ${ayudaUploadsCreated} upload(s) created across ${ayudaPrograms.length} program(s).`);

  // ── 5. Kanban tasks — one KanbanAttachment each ─────────────────────────
  let kanbanAttachmentsCreated = 0;
  if (kanbanAttachment) {
    const demoTasks = await prisma.kanbanTask.findMany({
      where: { tenantId, title: { startsWith: "[DEMO]" } },
      select: { id: true },
    });
    const tasksToCheck = demoTasks.length > 0 ? demoTasks : await prisma.kanbanTask.findMany({
      where: { tenantId },
      select: { id: true },
    });
    for (const task of tasksToCheck) {
      const existing = await prisma.kanbanAttachment.findFirst({
        where: { taskId: task.id },
        select: { id: true },
      });
      if (existing) continue;
      await prisma.kanbanAttachment.create({
        data: {
          taskId: task.id,
          filePath: kanbanAttachment.storageKey,
          originalFilename: kanbanAttachment.originalFilename,
          mimeType: kanbanAttachment.mimeType,
          fileSize: kanbanAttachment.fileSize,
          uploadedById: demoUser.id,
        },
      });
      kanbanAttachmentsCreated++;
    }
  } else {
    console.warn("  ⚠  kanban-attachment-site.png missing — kanban tasks left unchanged.");
  }
  console.log(`  ✅ Kanban tasks: ${kanbanAttachmentsCreated} attachment(s) created.`);

  console.log(
    `\n🎉 Demo media attach complete for tenant "${TENANT_SLUG}": ` +
      `${vesselsUpdated} vessels · ${violationsUpdated} violations (${violationAttachmentsCreated} reports) · ` +
      `${ayudaUploadsCreated} ayuda uploads · ${kanbanAttachmentsCreated} kanban attachments.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error("❌ seed-demo-calapan-media failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
