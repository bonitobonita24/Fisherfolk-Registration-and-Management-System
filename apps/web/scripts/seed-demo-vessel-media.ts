#!/usr/bin/env tsx
/**
 * seed-demo-vessel-media.ts — Real, VARIED vessel photos + scannable QR
 * payloads for the demo tenant.
 *
 * PROBLEM:
 *   1. seed-demo-calapan-media.ts pointed ALL demo vessels at ONE shared
 *      6.8KB placeholder PNG (vessel-photo-bangka.png) — every vessel detail
 *      page shows the same picture.
 *   2. Neither seed-demo.ts (vessels) nor seed-demo-calapan.ts (fisherfolk)
 *      ever set the `qrCode` payload column, so every demo detail page shows
 *      "No QR".
 *
 * FIX:
 *   - Build a pool of ~30 real boat/banca photos (magic-byte VALIDATED — the
 *     HTML-as-JPEG failure mode is rejected outright), upload to Telegram
 *     storage, and point each vessel at a random pool key.
 *   - Backfill Vessel.qrCode via buildQRPayload({id, regNo: mfvrNumber,
 *     tenantId}) — the EXACT producer convention used at registration time
 *     (see src/server/trpc/routers/vessel + fisherfolk create paths and the
 *     idPrint/id-card renderers, which all consume this payload).
 *   - Backfill Fisherfolk.qrCode via buildQRPayload({id, regNo: idNumber,
 *     tenantId}) for records missing it (BONUS GAP — same convention as
 *     routers/fisherfolk.ts create).
 *   - AFTER re-pointing, delete stale "vessel-photo" MediaObjects no longer
 *     referenced (mirrors fix-demo-photos.ts).
 *
 * Modeled on apps/web/scripts/fix-demo-photos.ts — reuses its env bootstrap,
 * ALLOW_DEMO_SEED hard guard, IPv4/DNS WSL2 fix, CLI + RNG helpers,
 * magic-byte image validation, and Telegram upload helper.
 *
 * Usage (from apps/web, after loading env):
 *   NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \
 *   ALLOW_DEMO_SEED=1 pnpm exec tsx scripts/seed-demo-vessel-media.ts \
 *     [--tenant <slug>]    (default: "demo" — the demo-stack tenant; use
 *                           --tenant calapan-demo for the local dev copy)
 *     [--photo-pool <n>]   (default: 30)
 *     [--seed <n>]         (default: 4242)
 *
 * Required env: DATABASE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_DEFAULT_CHANNEL_ID
 * (used unless the tenant's own telegramChannelId is set).
 *
 * Idempotent + safe to re-run: every run rebuilds the pool (fresh keys),
 * re-points every vessel, re-derives every qrCode payload (deterministic from
 * the row itself), then removes unreferenced old vessel-photo MediaObjects.
 */

import dns from "node:dns";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Force IPv4 first — WSL2 lesson (node.fetch.wsl2-ipv6-etimedout): a raw
// fetch() over the host's flaky IPv6 route ETIMEDOUTs. Setting the DNS
// result order avoids most of it; the https.Agent below is the belt-and-
// braces fallback for the direct fetch() calls in this file.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* older Node without setDefaultResultOrder — best effort only */
}

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
// Mirrors apps/web/scripts/fix-demo-photos.ts (docs/DATA_SEEDING_POLICY.md,
// owner-set 2026-07-08). Refuses to run unless ALLOW_DEMO_SEED is explicitly set.
if (
  process.env["ALLOW_DEMO_SEED"] !== "1" &&
  process.env["ALLOW_DEMO_SEED"] !== "true"
) {
  console.error(
    "❌ REFUSED: seed-demo-vessel-media.ts rewrites DEMO vessel photos and QR\n" +
      "   payloads. Policy (docs/DATA_SEEDING_POLICY.md): demo data is for LOCAL\n" +
      "   DEV + the DEMO stack ONLY — NEVER staging or production. Re-run with\n" +
      "   ALLOW_DEMO_SEED=1 only when the target DB is local dev or the demo stack.",
  );
  process.exit(1);
}

import { PrismaClient } from "@frms/db";
import {
  generateStorageKey,
  getTelegramBotToken,
  uploadDocumentToTelegram,
} from "@frms/storage";
import { buildQRPayload } from "../src/lib/qr-code";

// ESM-safe __dirname (for the local demo-asset fallback pool).
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

const TENANT_SLUG = getArg("tenant") ?? "demo";
const N_PHOTO_POOL = intArg("photo-pool", 30);
const RNG_SEED = intArg("seed", 4242);

// ── Deterministic RNG (mulberry32) — mirrors fix-demo-photos.ts ──────────────
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
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]!;

// ── Prisma ────────────────────────────────────────────────────────────────
const prisma = new PrismaClient();

// ── Image-bytes validation (copied from fix-demo-photos.ts) ─────────────────
// Reject HTML-as-JPEG outright: accept only real JPEG/PNG magic-byte-verified
// bodies of a sane minimum size.
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const MIN_VALID_BYTES = 2048; // 2KB

function detectImageMime(buffer: Buffer): "image/jpeg" | "image/png" | null {
  if (buffer.length < MIN_VALID_BYTES) return null;

  // Reject anything that looks like text/HTML masquerading as an image.
  const head = buffer.subarray(0, 32).toString("utf8").trimStart().toLowerCase();
  if (
    buffer[0] === 0x3c /* "<" */ ||
    head.startsWith("<!doctype") ||
    head.startsWith("<html")
  ) {
    return null;
  }

  if (JPEG_MAGIC.every((b, i) => buffer[i] === b)) return "image/jpeg";
  if (PNG_MAGIC.every((b, i) => buffer[i] === b)) return "image/png";
  return null;
}

type FetchResult = { buffer: Buffer; mimeType: "image/jpeg" | "image/png" } | null;

async function fetchValidImage(url: string, timeoutMs = 20_000): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      // @ts-expect-error -- undici accepts a Node https.Agent via the
      // "dispatcher"-adjacent `agent` field on some runtimes; harmless no-op
      // if ignored, kept as a best-effort IPv4 nudge alongside dns ordering.
      agent: ipv4Agent,
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = detectImageMime(buffer);
    if (mimeType === null) return null;
    return { buffer, mimeType };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function uploadBufferToTelegram(
  tenantId: string,
  chatId: string,
  botToken: string,
  entityType: "vessel-photo",
  filename: string,
  mimeType: string,
  buffer: Buffer,
): Promise<string> {
  const key = generateStorageKey(tenantId, entityType, filename);
  const { messageId, fileId } = await uploadDocumentToTelegram({
    botToken,
    chatId,
    bytes: new Uint8Array(buffer),
    filename,
    mimeType,
    caption: `${tenantId} · ${entityType} · ${key}`,
    maxRetries: 10,
  });

  const mediaObjectFields = {
    entityType,
    backend: "telegram",
    telegramChatId: chatId,
    telegramFileId: fileId,
    telegramMessageId: BigInt(messageId),
    sizeBytes: buffer.length,
    mimeType,
    migratedAt: new Date(),
  };

  await prisma.mediaObject.upsert({
    where: { tenantId_storageKey: { tenantId, storageKey: key } },
    create: { tenantId, storageKey: key, ...mediaObjectFields },
    update: mediaObjectFields,
  });

  return key;
}

/**
 * Build a VALIDATED pool of real boat/banca photos. Fetch strategy per image,
 * in order, until one yields valid image bytes (3-tier — the script never
 * hard-fails on fetch):
 *   a. loremflickr.com/640/480/boat,fishing — real Flickr JPEGs keyed to
 *      boat/fishing subjects; ?lock=<i> gives a stable, distinct image per i.
 *   b. picsum.photos/seed/frms-vessel-<i>/640/480.jpg — reliable real JPEGs
 *      (generic subject, still varied per seed).
 *   c. fallback: the bundled packages/db/demo-assets/vessel-photo-bangka.png.
 */
async function buildVesselPhotoPool(
  tenantId: string,
  chatId: string,
  botToken: string,
  count: number,
): Promise<{ keys: string[]; sourceCounts: Record<string, number> }> {
  const keys: string[] = [];
  const sourceCounts: Record<string, number> = {
    loremflickr: 0,
    picsum: 0,
    fallback: 0,
  };

  const fallbackPath = path.join(DEMO_ASSETS_DIR, "vessel-photo-bangka.png");

  for (let i = 0; i < count; i++) {
    const label = `demo-vessel-${String(i + 1).padStart(3, "0")}`;

    // (a) loremflickr — real boat/fishing photos.
    let result = await fetchValidImage(
      `https://loremflickr.com/640/480/boat,fishing?lock=${i + 1}`,
    );
    if (result !== null) {
      const ext = result.mimeType === "image/png" ? "png" : "jpg";
      const key = await uploadBufferToTelegram(
        tenantId,
        chatId,
        botToken,
        "vessel-photo",
        `${label}.${ext}`,
        result.mimeType,
        result.buffer,
      );
      keys.push(key);
      sourceCounts["loremflickr"]!++;
      continue;
    }

    // (b) picsum — reliable real JPEGs, varied per seed.
    result = await fetchValidImage(
      `https://picsum.photos/seed/frms-vessel-${i + 1}/640/480.jpg`,
    );
    if (result !== null) {
      const ext = result.mimeType === "image/png" ? "png" : "jpg";
      const key = await uploadBufferToTelegram(
        tenantId,
        chatId,
        botToken,
        "vessel-photo",
        `${label}-ps.${ext}`,
        result.mimeType,
        result.buffer,
      );
      keys.push(key);
      sourceCounts["picsum"]!++;
      continue;
    }

    // (c) fallback: the bundled banca placeholder — script never hard-fails.
    if (!fs.existsSync(fallbackPath)) {
      throw new Error(
        "Vessel photo fetch failed from all remote sources and the bundled " +
          "fallback packages/db/demo-assets/vessel-photo-bangka.png is missing.",
      );
    }
    const fallbackBuffer = fs.readFileSync(fallbackPath);
    const key = await uploadBufferToTelegram(
      tenantId,
      chatId,
      botToken,
      "vessel-photo",
      `${label}-fallback.png`,
      "image/png",
      fallbackBuffer,
    );
    keys.push(key);
    sourceCounts["fallback"]!++;

    if ((i + 1) % 10 === 0) {
      console.log(`  … ${i + 1}/${count} vessel photos processed`);
    }
  }

  return { keys, sourceCounts };
}

// ── main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(`🚤 Seeding vessel photos + QR payloads for tenant "${TENANT_SLUG}"...`);

  const tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (!tenant) {
    throw new Error(`Tenant "${TENANT_SLUG}" not found — run the demo seed chain first.`);
  }
  const tenantId = tenant.id;

  const chatId = tenant.telegramChannelId ?? process.env["TELEGRAM_DEFAULT_CHANNEL_ID"] ?? "";
  if (chatId === "") {
    throw new Error(
      "Missing Telegram chat id — set tenant.telegramChannelId or TELEGRAM_DEFAULT_CHANNEL_ID.",
    );
  }
  const botToken = getTelegramBotToken();

  // ── 1. Build the validated vessel photo pool ────────────────────────────
  console.log(`ℹ  Building validated vessel photo pool (${N_PHOTO_POOL})...`);
  const { keys: photoKeys, sourceCounts } = await buildVesselPhotoPool(
    tenantId,
    chatId,
    botToken,
    N_PHOTO_POOL,
  );
  console.log(
    `  ✅ Vessel photo pool: ${photoKeys.length} keys ` +
      `(loremflickr: ${sourceCounts["loremflickr"]}, ` +
      `picsum: ${sourceCounts["picsum"]}, fallback: ${sourceCounts["fallback"]}).`,
  );
  if (photoKeys.length === 0) {
    throw new Error("Refusing to proceed — vessel photo pool is empty.");
  }

  // ── 2. Vessels: varied photo + QR payload (producer convention:
  // regNo = mfvrNumber, matching the ID-template/idPrint path) ─────────────
  const vessels = await prisma.vessel.findMany({
    where: { tenantId },
    select: { id: true, mfvrNumber: true, qrCode: true },
    orderBy: { mfvrNumber: "asc" },
  });
  console.log(`ℹ  Updating ${vessels.length} vessels (photo + qrCode)...`);

  let vesselsUpdated = 0;
  for (const vessel of vessels) {
    await prisma.vessel.update({
      where: { id: vessel.id },
      data: {
        vesselPhoto: pick(photoKeys),
        qrCode: buildQRPayload({
          id: vessel.id,
          regNo: vessel.mfvrNumber,
          tenantId,
        }),
      },
    });
    vesselsUpdated++;
    if (vesselsUpdated % 50 === 0) {
      console.log(`  … ${vesselsUpdated}/${vessels.length} vessels updated`);
    }
  }
  console.log(`  ✅ ${vesselsUpdated} vessels re-pointed with varied photos + QR payloads.`);

  // ── 3. Fisherfolk: backfill missing QR payloads (BONUS GAP — producer
  // convention regNo = idNumber, matching routers/fisherfolk.ts create) ─────
  const fisherfolkMissingQR = await prisma.fisherfolk.findMany({
    where: { tenantId, qrCode: null },
    select: { id: true, idNumber: true },
  });
  console.log(`ℹ  Backfilling qrCode for ${fisherfolkMissingQR.length} fisherfolk...`);

  let fisherfolkUpdated = 0;
  for (const ff of fisherfolkMissingQR) {
    await prisma.fisherfolk.update({
      where: { id: ff.id },
      data: {
        qrCode: buildQRPayload({ id: ff.id, regNo: ff.idNumber, tenantId }),
      },
    });
    fisherfolkUpdated++;
    if (fisherfolkUpdated % 100 === 0) {
      console.log(`  … ${fisherfolkUpdated}/${fisherfolkMissingQR.length} fisherfolk backfilled`);
    }
  }
  console.log(`  ✅ ${fisherfolkUpdated} fisherfolk qrCode payloads backfilled.`);

  // ── 4. Delete stale vessel-photo MediaObjects (AFTER re-pointing, so
  // /api/media never serves a dangling key — mirrors fix-demo-photos.ts) ────
  const deleted = await prisma.mediaObject.deleteMany({
    where: {
      tenantId,
      entityType: "vessel-photo",
      storageKey: { notIn: photoKeys },
    },
  });
  console.log(`  ✅ Deleted ${deleted.count} stale "vessel-photo" MediaObjects.`);

  console.log(
    `\n🎉 seed-demo-vessel-media complete for tenant "${TENANT_SLUG}": ` +
      `${photoKeys.length} photos in pool, ${vesselsUpdated} vessels updated, ` +
      `${fisherfolkUpdated} fisherfolk QR backfilled, ${deleted.count} stale MediaObjects removed.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error("❌ seed-demo-vessel-media failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
