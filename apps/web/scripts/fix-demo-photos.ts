#!/usr/bin/env tsx
/**
 * fix-demo-photos.ts — Repair the demo tenant's fisherfolk photos.
 *
 * PROBLEM: seed-demo-calapan.ts built its photo pool by fetching
 * `https://thispersondoesnotexist.com/`, but that URL now returns an HTML
 * landing page instead of a JPEG. The old pool saved HTML bytes mislabeled
 * as image/jpeg — every demo fisherfolk photo is broken.
 *
 * FIX: rebuild a NEW photo pool from reliable sources, VALIDATING every
 * fetch by magic bytes before accepting it, upload the valid images to
 * Telegram, delete the stale bad MediaObjects, and re-point every demo
 * fisherfolk (not just null ones) at a new photo key.
 *
 * Modeled on apps/web/scripts/seed-demo-calapan.ts — reuses its env-loading
 * block, Telegram upload helper (uploadDocumentToTelegram +
 * prisma.mediaObject.upsert), tenant/chatId resolution, RNG/CLI arg
 * helpers, and the dns.setDefaultResultOrder("ipv4first") + IPv4 https.Agent
 * fix for WSL2 (node.fetch.wsl2-ipv6-etimedout).
 *
 * Usage (from apps/web, after loading env):
 *   set -a; . ./.env.dev; set +a
 *   ALLOW_DEMO_SEED=1 pnpm exec tsx scripts/fix-demo-photos.ts \
 *     [--tenant <slug>]    (default: "calapan-demo")
 *     [--photo-pool <n>]   (default: 100)
 *     [--seed <n>]         (default: 4242)
 *
 * Required env: DATABASE_URL, STORAGE_BACKEND=telegram, TELEGRAM_BOT_TOKEN,
 * TELEGRAM_DEFAULT_CHANNEL_ID (used unless the demo tenant's own
 * telegramChannelId is set).
 *
 * Idempotent + safe to re-run: each run builds a fresh pool (new storage-key
 * prefix), re-points every fisherfolk in the tenant, then deletes whatever
 * old "fisherfolk-photo" MediaObjects are no longer referenced.
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
// Mirrors apps/web/scripts/seed-demo-calapan-media.ts (docs/DATA_SEEDING_POLICY.md,
// owner-set 2026-07-08). Refuses to run unless ALLOW_DEMO_SEED is explicitly set.
if (
  process.env["ALLOW_DEMO_SEED"] !== "1" &&
  process.env["ALLOW_DEMO_SEED"] !== "true"
) {
  console.error(
    "❌ REFUSED: fix-demo-photos.ts rebuilds DUMMY/DEMO fisherfolk photos and\n" +
      "   re-points every demo fisherfolk record. Policy (docs/DATA_SEEDING_POLICY.md):\n" +
      "   demo data is for LOCAL DEV + the DEMO stack ONLY — NEVER staging or\n" +
      "   production. Re-run with ALLOW_DEMO_SEED=1 only when the target DB is\n" +
      "   local dev or the demo stack.",
  );
  process.exit(1);
}

import { PrismaClient } from "@frms/db";
import {
  generateStorageKey,
  getTelegramBotToken,
  uploadDocumentToTelegram,
} from "@frms/storage";

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

const TENANT_SLUG = getArg("tenant") ?? "calapan-demo";
const N_PHOTO_POOL = intArg("photo-pool", 100);
const RNG_SEED = intArg("seed", 4242);

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
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]!;

// ── Prisma ────────────────────────────────────────────────────────────────
const prisma = new PrismaClient();

// ── Image-bytes validation (the whole fix) ──────────────────────────────────
// Reject the previous failure mode outright: an HTML landing page saved as
// "image/jpeg". Accept only real JPEG/PNG magic-byte-verified bodies of a
// sane minimum size.
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const MIN_VALID_BYTES = 2048; // 2KB

function detectImageMime(buffer: Buffer): "image/jpeg" | "image/png" | null {
  if (buffer.length < MIN_VALID_BYTES) return null;

  // Reject anything that looks like text/HTML masquerading as an image —
  // the exact failure mode this script fixes.
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

async function fetchValidImage(url: string, timeoutMs = 15_000): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
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
  entityType: "fisherfolk-photo",
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
 * Build a NEW, VALIDATED photo pool. Fetch strategy per image, in order,
 * until one yields VALID image bytes:
 *   a. thispersondoesnotexist.com/image (direct JPEG endpoint)
 *   b. randomuser.me/api/portraits/{men|women}/{0-99}.jpg (reliable direct
 *      JPEGs; alternated + indexed by counter)
 *   c. fallback: cycle the bundled qa-fisherfolk-photo-*.jpg fixtures
 */
async function buildValidatedPhotoPool(
  tenantId: string,
  chatId: string,
  botToken: string,
  count: number,
): Promise<{ keys: string[]; sourceCounts: Record<string, number> } > {
  const keys: string[] = [];
  const sourceCounts: Record<string, number> = {
    thispersondoesnotexist: 0,
    randomuser: 0,
    fallback: 0,
  };

  const fallbackFiles = fs
    .readdirSync(DEMO_ASSETS_DIR)
    .filter((f) => /^qa-fisherfolk-photo-\d+\.jpe?g$/i.test(f))
    .sort();

  for (let i = 0; i < count; i++) {
    const label = `fix-face-${String(i + 1).padStart(3, "0")}`;

    // (a) thispersondoesnotexist.com/image — direct JPEG endpoint.
    let result = await fetchValidImage("https://thispersondoesnotexist.com/image");
    if (result !== null) {
      const key = await uploadBufferToTelegram(
        tenantId,
        chatId,
        botToken,
        "fisherfolk-photo",
        `${label}.jpg`,
        result.mimeType,
        result.buffer,
      );
      keys.push(key);
      sourceCounts["thispersondoesnotexist"]!++;
      continue;
    }

    // (b) randomuser.me/api/portraits/{men|women}/{0-99}.jpg — reliable
    // direct JPEGs, alternated by index parity.
    const portraitIdx = i % 100;
    const gender = i % 2 === 0 ? "men" : "women";
    result = await fetchValidImage(
      `https://randomuser.me/api/portraits/${gender}/${portraitIdx}.jpg`,
    );
    if (result !== null) {
      const key = await uploadBufferToTelegram(
        tenantId,
        chatId,
        botToken,
        "fisherfolk-photo",
        `${label}-ru.jpg`,
        result.mimeType,
        result.buffer,
      );
      keys.push(key);
      sourceCounts["randomuser"]!++;
      continue;
    }

    // (c) fallback: cycle the bundled QA fisherfolk photo fixtures.
    if (fallbackFiles.length === 0) {
      throw new Error(
        "Photo pool fetch failed from all remote sources and no local fallback assets found in demo-assets/.",
      );
    }
    const fallbackFile = fallbackFiles[i % fallbackFiles.length]!;
    const fallbackBuffer = fs.readFileSync(path.join(DEMO_ASSETS_DIR, fallbackFile));
    const key = await uploadBufferToTelegram(
      tenantId,
      chatId,
      botToken,
      "fisherfolk-photo",
      `${label}-fallback.jpg`,
      "image/jpeg",
      fallbackBuffer,
    );
    keys.push(key);
    sourceCounts["fallback"]!++;

    if ((i + 1) % 25 === 0) {
      console.log(`  … ${i + 1}/${count} photos processed`);
    }
  }

  return { keys, sourceCounts };
}

// ── main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(`🔧 Fixing demo fisherfolk photos for tenant "${TENANT_SLUG}"...`);

  const tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (!tenant) {
    throw new Error(`Tenant "${TENANT_SLUG}" not found — run seed-demo-calapan.ts first.`);
  }
  const tenantId = tenant.id;

  const chatId = tenant.telegramChannelId ?? process.env["TELEGRAM_DEFAULT_CHANNEL_ID"] ?? "";
  if (chatId === "") {
    throw new Error(
      "Missing Telegram chat id — set tenant.telegramChannelId or TELEGRAM_DEFAULT_CHANNEL_ID.",
    );
  }
  const botToken = getTelegramBotToken();

  // ── 1. Build the new, validated photo pool ─────────────────────────────
  console.log(`ℹ  Building validated photo pool (${N_PHOTO_POOL})...`);
  const { keys: photoKeys, sourceCounts } = await buildValidatedPhotoPool(
    tenantId,
    chatId,
    botToken,
    N_PHOTO_POOL,
  );
  console.log(
    `  ✅ New photo pool: ${photoKeys.length} keys ` +
      `(thispersondoesnotexist: ${sourceCounts["thispersondoesnotexist"]}, ` +
      `randomuser: ${sourceCounts["randomuser"]}, fallback: ${sourceCounts["fallback"]}).`,
  );
  if (photoKeys.length === 0) {
    throw new Error("Refusing to proceed — new photo pool is empty.");
  }

  // ── 2. Re-point EVERY demo fisherfolk (not just null ones) ─────────────
  const fisherfolkRows = await prisma.fisherfolk.findMany({
    where: { tenantId },
    select: { id: true },
  });
  console.log(`ℹ  Re-pointing ${fisherfolkRows.length} fisherfolk photos...`);

  let repointed = 0;
  for (const row of fisherfolkRows) {
    const photo = pick(photoKeys);
    await prisma.fisherfolk.update({
      where: { id: row.id },
      data: { photo },
    });
    repointed++;
    if (repointed % 100 === 0) {
      console.log(`  … ${repointed}/${fisherfolkRows.length} fisherfolk re-pointed`);
    }
  }
  console.log(`  ✅ Re-pointed ${repointed} fisherfolk to the new photo pool.`);

  // ── 3. Delete stale bad MediaObjects (AFTER re-pointing, so /api/media ──
  // never serves stale HTML and nothing still-referenced gets removed).
  const deleted = await prisma.mediaObject.deleteMany({
    where: {
      tenantId,
      entityType: "fisherfolk-photo",
      storageKey: { notIn: photoKeys },
    },
  });
  console.log(`  ✅ Deleted ${deleted.count} stale "fisherfolk-photo" MediaObjects.`);

  console.log(
    `\n🎉 fix-demo-photos complete for tenant "${TENANT_SLUG}": ` +
      `${photoKeys.length} valid photos in pool, ${repointed} fisherfolk re-pointed, ` +
      `${deleted.count} stale MediaObjects removed.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error("❌ fix-demo-photos failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
