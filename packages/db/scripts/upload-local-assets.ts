/**
 * upload-local-assets.ts
 *
 * Standalone tool: uploads LOCAL image assets (photos/signatures already
 * sitting on disk, keyed by fisherfolk idNumber) to the configured storage
 * backend (Telegram only), writes the corresponding `MediaObject` ledger
 * row, and links the result onto the matching fisherfolk record's
 * `photo`/`signature` field — but ONLY when that field is currently empty
 * (never overwrites an existing asset).
 *
 * This mirrors the write path in
 * `apps/web/src/server/trpc/routers/upload.ts` (the `getStorageBackend() ===
 * "telegram"` branch) and the ledger-upsert style used by
 * `packages/db/scripts/telegram-backfill/apply.ts`.
 *
 * Directory layout expected under --dir (any subset may be present):
 *   <dir>/PHOTO/<idNumber>.jpg|.jpeg          -> fisherfolk-photo
 *   <dir>/SIGNATURE/<idNumber>.png            -> fisherfolk-signature
 *   <dir>/missingpix/<idNumber>.jpg|.jpeg     -> fisherfolk-photo
 *   <dir>/missingpix/<idNumber>.png           -> fisherfolk-signature
 * If none of PHOTO/SIGNATURE/missingpix exist under --dir, --dir itself is
 * scanned (mixed .jpg/.jpeg/.png files) using the same jpg->photo,
 * png->signature mapping. Files named "Thumbs.db" (case-insensitive) are
 * ignored everywhere.
 *
 * Usage (via tsx, from packages/db):
 *
 *   # Dry run (no --confirm): prints discovery counts only, uploads nothing.
 *   pnpm --filter @frms/db exec tsx scripts/upload-local-assets.ts \
 *     --tenant <tenantId> --dir ./local-assets
 *
 *   # Live run.
 *   pnpm --filter @frms/db exec tsx scripts/upload-local-assets.ts \
 *     --tenant <tenantId> --dir ./local-assets --chat <channelId> --confirm
 *
 * Required env vars: DATABASE_URL, STORAGE_BACKEND=telegram,
 * TELEGRAM_BOT_TOKEN, TELEGRAM_DEFAULT_CHANNEL_ID (used as --chat default
 * when --chat is omitted).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

import { PrismaClient } from "@prisma/client";
import {
  generateStorageKey,
  getStorageBackend,
  getTelegramBotToken,
  uploadDocumentToTelegram,
} from "@frms/storage";

// ---------------------------------------------------------------------------
// CLI arg parsing (mirrors telegram-backfill/index.ts)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Asset discovery
// ---------------------------------------------------------------------------

type AssetKind = "photo" | "signature";

interface DiscoveredAsset {
  idNumber: string;
  kind: AssetKind;
  filePath: string;
  mimeType: string;
  entityType: "fisherfolk-photo" | "fisherfolk-signature";
}

const KNOWN_SUBDIRS = ["PHOTO", "SIGNATURE", "missingpix"] as const;

function extToKindAndMime(
  ext: string,
): { kind: AssetKind; mimeType: string } | undefined {
  const lower = ext.toLowerCase();
  if (lower === ".jpg" || lower === ".jpeg") {
    return { kind: "photo", mimeType: "image/jpeg" };
  }
  if (lower === ".png") {
    return { kind: "signature", mimeType: "image/png" };
  }
  return undefined;
}

function entityTypeForKind(
  kind: AssetKind,
): "fisherfolk-photo" | "fisherfolk-signature" {
  return kind === "photo" ? "fisherfolk-photo" : "fisherfolk-signature";
}

function scanDir(dir: string): DiscoveredAsset[] {
  const assets: DiscoveredAsset[] = [];

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return assets;
  }

  for (const name of entries) {
    if (name.toLowerCase() === "thumbs.db") {
      continue;
    }
    const filePath = join(dir, name);
    let isFile: boolean;
    try {
      isFile = statSync(filePath).isFile();
    } catch {
      continue;
    }
    if (!isFile) {
      continue;
    }

    const ext = extname(name);
    const mapped = extToKindAndMime(ext);
    if (mapped === undefined) {
      continue;
    }

    const idNumber = basename(name, ext);
    assets.push({
      idNumber,
      kind: mapped.kind,
      filePath,
      mimeType: mapped.mimeType,
      entityType: entityTypeForKind(mapped.kind),
    });
  }

  return assets;
}

function discoverAssets(rootDir: string): DiscoveredAsset[] {
  const hasKnownSubdir = KNOWN_SUBDIRS.some((sub) => {
    try {
      return statSync(join(rootDir, sub)).isDirectory();
    } catch {
      return false;
    }
  });

  if (!hasKnownSubdir) {
    return scanDir(rootDir);
  }

  const assets: DiscoveredAsset[] = [];
  for (const sub of KNOWN_SUBDIRS) {
    assets.push(...scanDir(join(rootDir, sub)));
  }
  return assets;
}

// ---------------------------------------------------------------------------
// Prisma surfaces (narrowed, matches telegram-backfill/apply.ts style)
// ---------------------------------------------------------------------------

interface FisherfolkRow {
  id: string;
  photo: string | null;
  signature: string | null;
}

interface UploadPrismaClient {
  fisherfolk: {
    findUnique(args: {
      where: { tenantId_idNumber: { tenantId: string; idNumber: string } };
    }): Promise<FisherfolkRow | null>;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
    }): Promise<unknown>;
  };
  mediaObject: {
    upsert(args: {
      where: { tenantId_storageKey: { tenantId: string; storageKey: string } };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }): Promise<unknown>;
  };
}

// ---------------------------------------------------------------------------
// Core run logic
// ---------------------------------------------------------------------------

export interface RunUploadLocalAssetsOptions {
  prisma: UploadPrismaClient;
  tenantId: string;
  dir: string;
  chatId: string;
  botToken: string;
  limit?: number;
  log?: (msg: string) => void;
}

export interface RunUploadLocalAssetsResult {
  discovered: number;
  filled: number;
  skippedAlready: number;
  skippedNoRecord: number;
}

export async function runUploadLocalAssets(
  opts: RunUploadLocalAssetsOptions,
): Promise<RunUploadLocalAssetsResult> {
  const { prisma, tenantId, dir, chatId, botToken, limit, log = () => {} } = opts;

  if (chatId === "") {
    throw new Error("Missing --chat and TELEGRAM_DEFAULT_CHANNEL_ID is unset");
  }

  const assets = discoverAssets(dir);

  const result: RunUploadLocalAssetsResult = {
    discovered: assets.length,
    filled: 0,
    skippedAlready: 0,
    skippedNoRecord: 0,
  };

  let processed = 0;
  for (const asset of assets) {
    if (limit !== undefined && processed >= limit) {
      break;
    }
    processed++;

    const fisherfolk = await prisma.fisherfolk.findUnique({
      where: { tenantId_idNumber: { tenantId, idNumber: asset.idNumber } },
    });
    if (fisherfolk === null) {
      result.skippedNoRecord++;
      log(`skip (no record): ${asset.idNumber}`);
      continue;
    }

    const targetField = asset.kind === "photo" ? "photo" : "signature";
    const currentValue = fisherfolk[targetField];
    if (currentValue !== null && currentValue !== "") {
      result.skippedAlready++;
      log(`skip (already set): ${asset.idNumber}.${asset.kind}`);
      continue;
    }

    const buffer = readFileSync(asset.filePath);

    const key = generateStorageKey(tenantId, asset.entityType, basename(asset.filePath));

    const { messageId, fileId } = await uploadDocumentToTelegram({
      botToken,
      chatId,
      bytes: new Uint8Array(buffer),
      filename: basename(asset.filePath),
      mimeType: asset.mimeType,
      caption: `${tenantId} · ${asset.entityType} · ${asset.idNumber}`,
    });

    const mediaObjectFields = {
      entityType: asset.entityType,
      backend: "telegram",
      telegramChatId: chatId,
      telegramFileId: fileId,
      telegramMessageId: BigInt(messageId),
      sizeBytes: buffer.length,
      mimeType: asset.mimeType,
      migratedAt: new Date(),
    };

    await prisma.mediaObject.upsert({
      where: { tenantId_storageKey: { tenantId, storageKey: key } },
      create: { tenantId, storageKey: key, ...mediaObjectFields },
      update: mediaObjectFields,
    });

    await prisma.fisherfolk.update({
      where: { id: fisherfolk.id },
      data: { [targetField]: key },
    });

    result.filled++;
    log(`filled ${asset.idNumber}.${asset.kind} -> ${key}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const tenantId = requireArg(args, "tenant");
  const dir = requireArg(args, "dir");
  const chatId = getArg(args, "chat") ?? process.env["TELEGRAM_DEFAULT_CHANNEL_ID"] ?? "";
  const limitArg = getArg(args, "limit");
  const limit = limitArg !== undefined ? Number(limitArg) : undefined;
  const confirm = hasFlag(args, "confirm");

  if (getStorageBackend() !== "telegram") {
    throw new Error(
      "upload-local-assets.ts only supports STORAGE_BACKEND=telegram. " +
        "Set STORAGE_BACKEND=telegram in the environment before running.",
    );
  }

  if (!confirm) {
    const assets = discoverAssets(dir);
    const byKind: Record<AssetKind, number> = { photo: 0, signature: 0 };
    for (const asset of assets) {
      byKind[asset.kind]++;
    }
    console.log(
      `DRY RUN (pass --confirm to execute): discovered ${String(assets.length)} asset file(s) under "${dir}" ` +
        `(photo=${String(byKind.photo)}, signature=${String(byKind.signature)}) for tenant "${tenantId}".` +
        (limit !== undefined ? ` Limited to ${String(limit)} entries.` : ""),
    );
    return;
  }

  if (chatId === "") {
    throw new Error("Missing --chat and TELEGRAM_DEFAULT_CHANNEL_ID is unset");
  }

  const prisma = new PrismaClient();
  const botToken = getTelegramBotToken();

  const result = await runUploadLocalAssets({
    prisma,
    tenantId,
    dir,
    chatId,
    botToken,
    limit,
    log: (msg) => console.log(msg),
  });

  console.log(
    `\nupload-local-assets complete: discovered=${String(result.discovered)} filled=${String(result.filled)} ` +
      `skippedAlready=${String(result.skippedAlready)} skippedNoRecord=${String(result.skippedNoRecord)}`,
  );

  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
