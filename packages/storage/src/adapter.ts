/**
 * adapter.ts
 *
 * StorageAdapter abstraction (T3 — see
 * docs/plans/telegram-storage-migration-plan.md §2/§10 T3).
 *
 * Config-driven backend selection via STORAGE_BACKEND ("minio" | "s3" |
 * "telegram", default "minio"). Both "minio" and "s3" resolve to the same
 * S3Adapter (S3Client from client.ts), since MinIO and AWS S3 share the S3
 * wire protocol — only the endpoint/credentials differ, at the env level.
 *
 * This module (and the whole @frms/storage package) stays prisma-free: the
 * TelegramAdapter never looks up a tenant's channel or writes a ledger row.
 * The app layer resolves `tenant.telegramChannelId ?? TELEGRAM_DEFAULT_CHANNEL_ID`
 * and passes the resolved chatId into `upload()`, and separately persists the
 * MediaObject ledger row from the enriched UploadResult (T4).
 */

import {
  uploadFile as s3UploadFile,
  getFileDownloadUrl as s3GetFileDownloadUrl,
  deleteFile as s3DeleteFile,
  fileExists as s3FileExists,
  type UploadInput,
  type UploadResult,
} from "./upload";
import { generateStorageKey } from "./validation";
import { getTelegramBotToken, uploadDocumentToTelegram } from "./telegram";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Input for TelegramAdapter.upload(). Extends the plain UploadInput with the
 * already-resolved Telegram chat_id — the adapter does NOT look up the
 * tenant/DB itself; the caller (app layer) resolves
 * `tenant.telegramChannelId ?? TELEGRAM_DEFAULT_CHANNEL_ID` and passes it in.
 */
export interface TelegramUploadInput extends UploadInput {
  chatId: string;
}

export type StorageBackend = "minio" | "s3" | "telegram";

export interface StorageAdapter {
  upload(input: UploadInput | TelegramUploadInput): Promise<UploadResult>;
  getDownloadUrl(key: string, tenantId: string, ttl?: number): Promise<string>;
  delete(key: string, tenantId: string): Promise<void>;
  exists(key: string, tenantId: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// S3Adapter — extracted verbatim from upload.ts (serves MinIO + future AWS S3)
// ---------------------------------------------------------------------------

/**
 * S3Adapter wraps today's upload.ts behaviour unchanged. Both MinIO (dev/
 * staging/prod today) and AWS S3 (future, funded) are the same S3Client from
 * client.ts — only STORAGE_ENDPOINT/credentials differ at the env level, so
 * one adapter class serves both "minio" and "s3" STORAGE_BACKEND values.
 */
export class S3Adapter implements StorageAdapter {
  async upload(input: UploadInput): Promise<UploadResult> {
    return s3UploadFile(input);
  }

  async getDownloadUrl(key: string, tenantId: string, ttl = 3600): Promise<string> {
    return s3GetFileDownloadUrl(key, tenantId, ttl);
  }

  async delete(key: string, tenantId: string): Promise<void> {
    return s3DeleteFile(key, tenantId);
  }

  async exists(key: string, tenantId: string): Promise<boolean> {
    return s3FileExists(key, tenantId);
  }
}

// ---------------------------------------------------------------------------
// TelegramAdapter
// ---------------------------------------------------------------------------

/**
 * TelegramAdapter uploads bytes to a Telegram channel via sendDocument and
 * formats proxied download URLs. It never touches the DB:
 *  - upload() does NOT write the MediaObject ledger row (app layer does, T4).
 *  - getDownloadUrl() does NOT look up the ledger; it purely formats the
 *    "/api/media?key=..." URL the app-layer route (T5) resolves.
 *  - delete() is a best-effort no-op at this layer: Telegram's Bot API cannot
 *    reliably delete channel messages older than 48h, so the real
 *    soft-delete semantics live in the app-layer MediaObject ledger
 *    (see docs/plans/telegram-storage-migration-plan.md §2, §9 "Secondary" risks).
 *  - exists() is best-effort/formatting-only: without a DB lookup the adapter
 *    cannot truly confirm a Telegram file_id still resolves, so it returns
 *    true whenever the key is well-formed. Real existence should be checked
 *    against the MediaObject ledger in the app layer.
 */
export class TelegramAdapter implements StorageAdapter {
  async upload(input: UploadInput | TelegramUploadInput): Promise<UploadResult> {
    if (!("chatId" in input) || input.chatId === "") {
      throw new Error(
        "TelegramAdapter.upload requires a resolved chatId (tenant.telegramChannelId ?? TELEGRAM_DEFAULT_CHANNEL_ID)",
      );
    }

    const key = generateStorageKey(input.tenantId, input.entityType, input.originalFilename);
    const botToken = getTelegramBotToken();
    const caption = `${input.tenantId} · ${input.entityType} · ${key}`;

    const { messageId, fileId } = await uploadDocumentToTelegram({
      botToken,
      chatId: input.chatId,
      bytes: new Uint8Array(input.buffer),
      filename: input.originalFilename,
      mimeType: input.mimeType,
      caption,
    });

    return {
      key,
      bucket: "",
      sizeBytes: input.buffer.length,
      mimeType: input.mimeType,
      backend: "telegram",
      telegramFileId: fileId,
      telegramMessageId: messageId,
      telegramChatId: input.chatId,
    };
  }

  getDownloadUrl(key: string, _tenantId: string, _ttl?: number): Promise<string> {
    return Promise.resolve(`/api/media?key=${encodeURIComponent(key)}`);
  }

  async delete(_key: string, _tenantId: string): Promise<void> {
    // Best-effort no-op: Telegram cannot reliably delete channel messages
    // older than 48h. The app-layer MediaObject ledger row is the real
    // soft-delete record (set a deletedAt-style field there). See plan §2.
    return Promise.resolve();
  }

  async exists(key: string, _tenantId: string): Promise<boolean> {
    // Formatting-only best-effort: a well-formed key is assumed to exist.
    // Real existence must be verified against the MediaObject ledger
    // (telegramFileId non-null) in the app layer.
    return Promise.resolve(key.length > 0);
  }
}

// ---------------------------------------------------------------------------
// resolveBackend() — config-driven factory
// ---------------------------------------------------------------------------

export function getStorageBackend(): StorageBackend {
  const value = process.env["STORAGE_BACKEND"];
  if (value === "telegram") {
    return "telegram";
  }
  if (value === "s3") {
    return "s3";
  }
  return "minio";
}

/**
 * Return the StorageAdapter instance for the configured STORAGE_BACKEND.
 * "minio" and "s3" both resolve to S3Adapter (same S3Client, different env).
 */
export function resolveBackend(): StorageAdapter {
  const backend = getStorageBackend();
  if (backend === "telegram") {
    return new TelegramAdapter();
  }
  return new S3Adapter();
}
