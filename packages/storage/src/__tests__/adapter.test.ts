/**
 * Unit tests — packages/storage/src/adapter.ts (T3)
 *
 * Covers:
 *  1. resolveBackend() returns S3Adapter for minio/s3/unset, TelegramAdapter for telegram.
 *  2. S3Adapter.getDownloadUrl still produces a presigned S3 URL (mocked presigner).
 *  3. TelegramAdapter.getDownloadUrl returns the exact "/api/media?key=..." encoded string,
 *     with no network/DB calls.
 *  4. TelegramAdapter.upload calls uploadDocumentToTelegram and returns enriched
 *     metadata without any DB call (telegram.ts mocked).
 *
 * See docs/plans/telegram-storage-migration-plan.md §2 / §10 T3.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(() =>
    Promise.resolve("https://minio.example.com/bucket/signed?X-Amz-Signature=abc"),
  ),
}));

vi.mock("../telegram", () => ({
  uploadDocumentToTelegram: vi.fn(() =>
    Promise.resolve({ messageId: 42, fileId: "tg-file-id-123" }),
  ),
  getTelegramBotToken: vi.fn(() => "test-bot-token"),
  fetchTelegramFileBytes: vi.fn(),
}));

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { uploadDocumentToTelegram } from "../telegram";
import {
  S3Adapter,
  TelegramAdapter,
  resolveBackend,
  getStorageBackend,
} from "../adapter";

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
}

describe("adapter.ts", () => {
  beforeEach(() => {
    resetEnv();
    process.env["STORAGE_ENDPOINT"] = "http://localhost:9000";
    process.env["STORAGE_ACCESS_KEY"] = "minioadmin";
    process.env["STORAGE_SECRET_KEY"] = "minioadmin";
    process.env["STORAGE_BUCKET"] = "frms-media";
    process.env["TELEGRAM_BOT_TOKEN"] = "test-bot-token";
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetEnv();
  });

  describe("getStorageBackend / resolveBackend", () => {
    it("defaults to minio (S3Adapter) when STORAGE_BACKEND is unset", () => {
      delete process.env["STORAGE_BACKEND"];
      expect(getStorageBackend()).toBe("minio");
      expect(resolveBackend()).toBeInstanceOf(S3Adapter);
    });

    it("returns S3Adapter for STORAGE_BACKEND=minio", () => {
      process.env["STORAGE_BACKEND"] = "minio";
      expect(getStorageBackend()).toBe("minio");
      expect(resolveBackend()).toBeInstanceOf(S3Adapter);
    });

    it("returns S3Adapter for STORAGE_BACKEND=s3", () => {
      process.env["STORAGE_BACKEND"] = "s3";
      expect(getStorageBackend()).toBe("s3");
      expect(resolveBackend()).toBeInstanceOf(S3Adapter);
    });

    it("returns TelegramAdapter for STORAGE_BACKEND=telegram", () => {
      process.env["STORAGE_BACKEND"] = "telegram";
      expect(getStorageBackend()).toBe("telegram");
      expect(resolveBackend()).toBeInstanceOf(TelegramAdapter);
    });
  });

  describe("S3Adapter", () => {
    it("getDownloadUrl still produces a presigned S3 URL for a same-tenant key", async () => {
      const adapter = new S3Adapter();
      const url = await adapter.getDownloadUrl("tenant-a/fisherfolk-photo/abc123.jpg", "tenant-a");

      expect(url).toBe("https://minio.example.com/bucket/signed?X-Amz-Signature=abc");
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });

    it("getDownloadUrl rejects a cross-tenant key", async () => {
      const adapter = new S3Adapter();
      await expect(
        adapter.getDownloadUrl("tenant-a/fisherfolk-photo/abc123.jpg", "tenant-b"),
      ).rejects.toThrow("Access denied");
    });
  });

  describe("TelegramAdapter", () => {
    it("getDownloadUrl returns the exact proxied URL with no network/DB calls", async () => {
      const adapter = new TelegramAdapter();
      const url = await adapter.getDownloadUrl("tenant-a/fisherfolk-photo/abc 123.jpg", "tenant-a");

      expect(url).toBe(
        `/api/media?key=${encodeURIComponent("tenant-a/fisherfolk-photo/abc 123.jpg")}`,
      );
      expect(uploadDocumentToTelegram).not.toHaveBeenCalled();
    });

    it("upload calls uploadDocumentToTelegram and returns enriched metadata, no DB call", async () => {
      const adapter = new TelegramAdapter();
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02]);

      const result = await adapter.upload({
        tenantId: "tenant-a",
        entityType: "fisherfolk-photo",
        originalFilename: "photo.jpg",
        mimeType: "image/jpeg",
        buffer,
        chatId: "-100123456789",
      });

      expect(uploadDocumentToTelegram).toHaveBeenCalledTimes(1);
      const call = vi.mocked(uploadDocumentToTelegram).mock.calls[0]?.[0];
      expect(call?.chatId).toBe("-100123456789");
      expect(call?.botToken).toBe("test-bot-token");
      expect(call?.caption).toContain("tenant-a");
      expect(call?.caption).toContain("fisherfolk-photo");

      expect(result.backend).toBe("telegram");
      expect(result.telegramFileId).toBe("tg-file-id-123");
      expect(result.telegramMessageId).toBe(42);
      expect(result.telegramChatId).toBe("-100123456789");
      expect(result.sizeBytes).toBe(buffer.length);
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.key).toMatch(/^tenant-a\/fisherfolk-photo\/[a-f0-9]{32}\.jpg$/);
    });

    it("upload throws when chatId is missing", async () => {
      const adapter = new TelegramAdapter();
      const buffer = Buffer.from([0xff, 0xd8, 0xff]);

      await expect(
        adapter.upload({
          tenantId: "tenant-a",
          entityType: "fisherfolk-photo",
          originalFilename: "photo.jpg",
          mimeType: "image/jpeg",
          buffer,
        }),
      ).rejects.toThrow(/chatId/);
    });

    it("delete is a best-effort no-op (does not throw)", async () => {
      const adapter = new TelegramAdapter();
      await expect(adapter.delete("tenant-a/fisherfolk-photo/abc.jpg", "tenant-a")).resolves.toBeUndefined();
    });

    it("exists is best-effort/formatting-only", async () => {
      const adapter = new TelegramAdapter();
      await expect(adapter.exists("tenant-a/fisherfolk-photo/abc.jpg", "tenant-a")).resolves.toBe(true);
    });
  });
});
