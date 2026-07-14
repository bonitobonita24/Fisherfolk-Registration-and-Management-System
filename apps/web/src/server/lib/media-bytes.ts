/**
 * media-bytes.ts
 *
 * resolveMediaBytes — the shared Telegram-first, MinIO-fallback byte
 * resolution core used by the /api/media proxy route (T5). Ported from
 * Marine-Guardian's proven `resolveAssetBytes` pattern
 * (apps/web/src/server/lib/asset-bytes.ts), adapted for FRMS's dual-read
 * source of truth during the Telegram-storage migration (see
 * docs/plans/telegram-storage-migration-plan.md).
 *
 * Flow:
 *   1. If a telegramFileId is present, try Telegram first (the new source of
 *      truth going forward). Any failure falls through to MinIO.
 *   2. If there is no telegramFileId, or the Telegram fetch failed, fall back
 *      to MinIO via a signed download URL + fetch (dual-read: media rows
 *      written before the Telegram migration still resolve correctly).
 *   3. If BOTH fail, throw — the caller (route) maps this to a 502.
 *
 * This module is intentionally prisma-free: the caller resolves telegramFileId
 * / storageKey from the DB (MediaObject ledger) and passes them in.
 */

import {
  fetchTelegramFileBytes,
  getTelegramBotToken,
  getFileDownloadUrl,
} from "@frms/storage";

export interface ResolvedMedia {
  bytes: Buffer;
  source: "telegram" | "minio";
}

export interface ResolveMediaBytesInput {
  tenantId: string;
  storageKey: string;
  telegramFileId: string | null;
  mimeType?: string | null;
}

async function resolveFromMinio(
  storageKey: string,
  tenantId: string,
): Promise<Buffer> {
  const url = await getFileDownloadUrl(storageKey, tenantId);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `MinIO download failed: HTTP ${String(res.status)} ${res.statusText}`,
    );
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function resolveMediaBytes(
  input: ResolveMediaBytesInput,
): Promise<ResolvedMedia> {
  const { tenantId, storageKey, telegramFileId } = input;

  // 1. Telegram-first, when a file_id is on record.
  if (telegramFileId !== null && telegramFileId !== "") {
    try {
      const { bytes } = await fetchTelegramFileBytes({
        botToken: getTelegramBotToken(),
        fileId: telegramFileId,
      });
      return { bytes: Buffer.from(bytes), source: "telegram" };
    } catch {
      // Swallow — degrade to the MinIO fallback below.
    }
  }

  // 2. MinIO fallback (also the direct path when there is no telegramFileId).
  try {
    const bytes = await resolveFromMinio(storageKey, tenantId);
    return { bytes, source: "minio" };
  } catch (minioError) {
    throw new Error(
      `Failed to resolve media bytes for key "${storageKey}": both Telegram and MinIO fetch failed. ${
        minioError instanceof Error ? minioError.message : String(minioError)
      }`,
    );
  }
}
