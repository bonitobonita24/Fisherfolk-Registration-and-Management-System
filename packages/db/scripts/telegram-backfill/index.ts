/**
 * index.ts — CLI for the Telegram photo-backfill tool.
 *
 * Two-phase migration of existing MinIO-stored fisherfolk/vessel media to
 * Telegram, with a resumable JSON manifest bridging the phases.
 *
 * Usage (via tsx, from packages/db):
 *
 *   # Phase A — upload source-tenant assets to Telegram, write a manifest.
 *   pnpm --filter @frms/db exec tsx scripts/telegram-backfill/index.ts upload \
 *     --tenant <sourceTenantId> \
 *     --out ./backfill-manifest.json \
 *     [--limit 50] [--entity fisherfolk-photo] [--resume]
 *
 *   # Phase B (demo) — write MediaObject ledger rows for the SAME tenant
 *   # the manifest was built against (records already reference
 *   # sourceStorageKey).
 *   pnpm --filter @frms/db exec tsx scripts/telegram-backfill/index.ts apply-demo \
 *     --manifest ./backfill-manifest.json \
 *     --tenant <sourceTenantId>
 *
 *   # Phase B (prod) — match manifest entries to a DIFFERENT (prod) tenant's
 *   # records by business key (idNumber / mfvrNumber), mint fresh prod keys,
 *   # and only fill fields that are currently null. Irreversible — requires
 *   # --confirm.
 *   pnpm --filter @frms/db exec tsx scripts/telegram-backfill/index.ts apply-prod \
 *     --manifest ./backfill-manifest.json \
 *     --tenant <prodTenantId> \
 *     --confirm
 *
 * Required env vars: DATABASE_URL, STORAGE_ENDPOINT, STORAGE_REGION,
 * STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, STORAGE_BUCKET,
 * TELEGRAM_BOT_TOKEN, TELEGRAM_DEFAULT_CHANNEL_ID (used as --chat default).
 */

import { PrismaClient } from "@prisma/client";
import { getBucket, getStorageClient, getTelegramBotToken } from "@frms/storage";

import { applyToDemo, applyToProd } from "./apply";
import type { BackfillEntityType } from "./manifest";
import { loadManifest, saveManifest } from "./manifest";
import { runUpload } from "./upload";

function getArg(args: string[], name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) {
    return undefined;
  }
  return args[idx + 1];
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(`--${name}`);
}

function requireArg(args: string[], name: string): string {
  const value = getArg(args, name);
  if (value === undefined) {
    throw new Error(`Missing required --${name} argument`);
  }
  return value;
}

async function cmdUpload(args: string[]): Promise<void> {
  const tenantId = requireArg(args, "tenant");
  const outPath = requireArg(args, "out");
  const limitArg = getArg(args, "limit");
  const entityArg = getArg(args, "entity") as BackfillEntityType | undefined;
  const resume = hasFlag(args, "resume");
  const throttleArg = getArg(args, "throttle");
  const chatId = getArg(args, "chat") ?? process.env["TELEGRAM_DEFAULT_CHANNEL_ID"] ?? "";
  if (chatId === "") {
    throw new Error("Missing --chat and TELEGRAM_DEFAULT_CHANNEL_ID is unset");
  }

  const prisma = new PrismaClient();
  const s3 = getStorageClient();
  const bucket = getBucket();
  const botToken = getTelegramBotToken();

  const existing = resume ? tryLoadExisting(outPath) : undefined;

  const manifest = await runUpload({
    prisma,
    s3,
    bucket,
    tenantId,
    chatId,
    botToken,
    limit: limitArg !== undefined ? Number(limitArg) : undefined,
    entityFilter: entityArg,
    existing,
    throttleMs: throttleArg !== undefined ? Number(throttleArg) : undefined,
    // Incremental persistence: write the manifest after every upload so a
    // mid-run crash is fully resumable and never re-uploads (no duplicate
    // permanent Telegram messages).
    onProgress: (m) => saveManifest(outPath, m),
    log: (msg) => console.log(msg),
  });

  saveManifest(outPath, manifest);
  console.log(`\nManifest written to ${outPath} — ${String(manifest.entries.length)} entries total.`);

  await prisma.$disconnect();
}

function tryLoadExisting(path: string): ReturnType<typeof loadManifest> | undefined {
  try {
    return loadManifest(path);
  } catch {
    return undefined;
  }
}

async function cmdApplyDemo(args: string[]): Promise<void> {
  const manifestPath = requireArg(args, "manifest");
  const tenantId = requireArg(args, "tenant");

  const manifest = loadManifest(manifestPath);
  const prisma = new PrismaClient();

  const result = await applyToDemo({
    prisma,
    manifest,
    tenantId,
    log: (msg) => console.log(msg),
  });

  console.log(`\napply-demo complete: upserted=${String(result.upserted)}`);
  await prisma.$disconnect();
}

async function cmdApplyProd(args: string[]): Promise<void> {
  const manifestPath = requireArg(args, "manifest");
  const prodTenantId = requireArg(args, "tenant");
  const confirm = hasFlag(args, "confirm");

  const manifest = loadManifest(manifestPath);
  const prisma = new PrismaClient();

  const result = await applyToProd({
    prisma,
    manifest,
    prodTenantId,
    confirm,
    log: (msg) => console.log(msg),
  });

  console.log(
    `\napply-prod complete: matched=${String(result.matched)} updated=${String(result.updated)} ` +
      `skippedUnmatched=${String(result.skippedUnmatched)} skippedAlreadySet=${String(result.skippedAlreadySet)}`,
  );
  await prisma.$disconnect();
}

async function main(): Promise<void> {
  const [, , command, ...rest] = process.argv;

  switch (command) {
    case "upload":
      await cmdUpload(rest);
      break;
    case "apply-demo":
      await cmdApplyDemo(rest);
      break;
    case "apply-prod":
      await cmdApplyProd(rest);
      break;
    default:
      console.error(
        "Usage: tsx index.ts <upload|apply-demo|apply-prod> [...args]\n" +
          "See file header for full usage.",
      );
      process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
