/**
 * Unit tests — upload tRPC router (T4/T6)
 *
 * Covers docs/plans/telegram-storage-migration-plan.md §2/§10 T4/T6:
 *  - uploadFile: telegram backend writes a MediaObject ledger row and
 *    returns the "/api/media?key=..." proxy url (no S3/MinIO call).
 *  - uploadFile: minio/s3 backend keeps existing behaviour unchanged.
 *  - getDownloadUrl: dual-read — prefers the MediaObject ledger (Telegram)
 *    and falls back to the signed S3/MinIO url when no ledger row exists.
 *
 * This suite mocks @frms/storage + ctx.db (no real DB, no network) — unlike
 * the DB-integration router tests (idPrint.test.ts etc.), so it runs in CI.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";

vi.mock("@frms/storage", () => ({
  generateStorageKey: vi.fn(
    (tenantId: string, entityType: string, originalFilename: string) =>
      `${tenantId}/${entityType}/generated-key.${originalFilename.split(".").pop()}`,
  ),
  getFileDownloadUrl: vi.fn(() =>
    Promise.resolve("https://minio.example.com/bucket/signed?X-Amz-Signature=abc"),
  ),
  getStorageBackend: vi.fn(() => "minio"),
  getTelegramBotToken: vi.fn(() => "test-bot-token"),
  isAllowedMimeType: vi.fn(() => true),
  uploadDocumentToTelegram: vi.fn(() =>
    Promise.resolve({ messageId: 42, fileId: "tg-file-id-123" }),
  ),
  uploadFile: vi.fn(() =>
    Promise.resolve({
      key: "tenant-a/fisherfolk-photo/s3-key.jpg",
      sizeBytes: 6,
      mimeType: "image/jpeg",
    }),
  ),
}));

import {
  generateStorageKey,
  getFileDownloadUrl,
  getStorageBackend,
  uploadDocumentToTelegram,
  uploadFile,
} from "@frms/storage";

import type { TRPCContext } from "../../context";
import { uploadRouter } from "../upload";
import { createCallerFactory } from "../../trpc";

const TENANT_ID = "tenant-a";
const USER_ID = "user-1";

function makeMockDb(overrides: Record<string, unknown> = {}) {
  return {
    tenant: {
      findUnique: vi.fn(() => Promise.resolve({ telegramChannelId: "-100999" })),
    },
    mediaObject: {
      create: vi.fn((_args: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "mo-1" }),
      ),
      findUnique: vi.fn(() => Promise.resolve(null)),
    },
    ...overrides,
  };
}

function makeCtx(db: ReturnType<typeof makeMockDb>): TRPCContext {
  return {
    session: {
      user: { id: USER_ID, name: "Test Encoder", email: "encoder@local" },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as unknown as Session,
    userId: USER_ID,
    role: "encoder",
    tenantId: TENANT_ID,
    tenantSlug: "tenant-a-slug",
    db: db as unknown as TRPCContext["db"],
    req: new Request("http://localhost/api/trpc"),
  };
}

const callerFactory = createCallerFactory(uploadRouter);

const validBase64 = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02]).toString("base64");

describe("uploadRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStorageBackend).mockReturnValue("minio");
  });

  describe("uploadFile — telegram backend (T4)", () => {
    it("writes a MediaObject ledger row and returns the proxy download url", async () => {
      vi.mocked(getStorageBackend).mockReturnValue("telegram");
      const db = makeMockDb();
      const caller = callerFactory(makeCtx(db));

      const result = await caller.uploadFile({
        base64: validBase64,
        mimeType: "image/jpeg",
        originalFilename: "photo.jpg",
        entityType: "fisherfolk-photo",
      });

      expect(uploadDocumentToTelegram).toHaveBeenCalledTimes(1);
      expect(uploadFile).not.toHaveBeenCalled();

      expect(db.mediaObject.create).toHaveBeenCalledTimes(1);
      const createCall = vi.mocked(db.mediaObject.create).mock.calls[0];
      if (!createCall) throw new Error("mediaObject.create was not called");
      expect(createCall[0].data).toMatchObject({
        tenantId: TENANT_ID,
        backend: "telegram",
        telegramChatId: "-100999",
        telegramFileId: "tg-file-id-123",
        telegramMessageId: BigInt(42),
        mimeType: "image/jpeg",
      });

      expect(result.downloadUrl).toBe(
        `/api/media?key=${encodeURIComponent(result.key)}`,
      );
      expect(result.mimeType).toBe("image/jpeg");
    });

    it("falls back to TELEGRAM_DEFAULT_CHANNEL_ID when tenant.telegramChannelId is null", async () => {
      vi.mocked(getStorageBackend).mockReturnValue("telegram");
      process.env["TELEGRAM_DEFAULT_CHANNEL_ID"] = "-100default";
      const db = makeMockDb({
        tenant: { findUnique: vi.fn(() => Promise.resolve({ telegramChannelId: null })) },
      });
      const caller = callerFactory(makeCtx(db));

      await caller.uploadFile({
        base64: validBase64,
        mimeType: "image/jpeg",
        originalFilename: "photo.jpg",
        entityType: "fisherfolk-photo",
      });

      const call = vi.mocked(uploadDocumentToTelegram).mock.calls[0]?.[0];
      expect(call?.chatId).toBe("-100default");

      delete process.env["TELEGRAM_DEFAULT_CHANNEL_ID"];
    });

    it("throws INTERNAL_SERVER_ERROR when no Telegram channel is configured", async () => {
      vi.mocked(getStorageBackend).mockReturnValue("telegram");
      delete process.env["TELEGRAM_DEFAULT_CHANNEL_ID"];
      const db = makeMockDb({
        tenant: { findUnique: vi.fn(() => Promise.resolve({ telegramChannelId: null })) },
      });
      const caller = callerFactory(makeCtx(db));

      await expect(
        caller.uploadFile({
          base64: validBase64,
          mimeType: "image/jpeg",
          originalFilename: "photo.jpg",
          entityType: "fisherfolk-photo",
        }),
      ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });

      expect(db.mediaObject.create).not.toHaveBeenCalled();
    });
  });

  describe("uploadFile — minio/s3 backend (unchanged behaviour)", () => {
    it("calls uploadFile + getFileDownloadUrl, never touches MediaObject", async () => {
      vi.mocked(getStorageBackend).mockReturnValue("minio");
      const db = makeMockDb();
      const caller = callerFactory(makeCtx(db));

      const result = await caller.uploadFile({
        base64: validBase64,
        mimeType: "image/jpeg",
        originalFilename: "photo.jpg",
        entityType: "fisherfolk-photo",
      });

      expect(uploadFile).toHaveBeenCalledTimes(1);
      expect(uploadDocumentToTelegram).not.toHaveBeenCalled();
      expect(db.mediaObject.create).not.toHaveBeenCalled();
      expect(getFileDownloadUrl).toHaveBeenCalledWith(
        "tenant-a/fisherfolk-photo/s3-key.jpg",
        TENANT_ID,
        3600,
      );
      expect(result.downloadUrl).toBe(
        "https://minio.example.com/bucket/signed?X-Amz-Signature=abc",
      );
    });
  });

  describe("getDownloadUrl — dual-read (T6)", () => {
    it("returns the proxy url when a telegram MediaObject ledger row exists", async () => {
      const db = makeMockDb({
        mediaObject: {
          create: vi.fn(),
          findUnique: vi.fn(() =>
            Promise.resolve({ backend: "telegram", telegramFileId: "tg-file-id-123" }),
          ),
        },
      });
      const caller = callerFactory(makeCtx(db));

      const result = await caller.getDownloadUrl({ key: "tenant-a/fisherfolk-photo/x.jpg" });

      expect(result.url).toBe(
        `/api/media?key=${encodeURIComponent("tenant-a/fisherfolk-photo/x.jpg")}`,
      );
      expect(getFileDownloadUrl).not.toHaveBeenCalled();
    });

    it("falls back to the signed S3/MinIO url when no MediaObject ledger row exists", async () => {
      const db = makeMockDb({
        mediaObject: { create: vi.fn(), findUnique: vi.fn(() => Promise.resolve(null)) },
      });
      const caller = callerFactory(makeCtx(db));

      const result = await caller.getDownloadUrl({ key: "tenant-a/fisherfolk-photo/x.jpg" });

      expect(result.url).toBe(
        "https://minio.example.com/bucket/signed?X-Amz-Signature=abc",
      );
      expect(getFileDownloadUrl).toHaveBeenCalledWith(
        "tenant-a/fisherfolk-photo/x.jpg",
        TENANT_ID,
        3600,
      );
    });

    it("falls back to signed url when a MediaObject exists but backend is not telegram", async () => {
      const db = makeMockDb({
        mediaObject: {
          create: vi.fn(),
          findUnique: vi.fn(() =>
            Promise.resolve({ backend: "minio", telegramFileId: null }),
          ),
        },
      });
      const caller = callerFactory(makeCtx(db));

      const result = await caller.getDownloadUrl({ key: "tenant-a/fisherfolk-photo/x.jpg" });

      expect(result.url).toBe(
        "https://minio.example.com/bucket/signed?X-Amz-Signature=abc",
      );
    });
  });
});

// Silence unused-import lint for generateStorageKey mock (referenced via the
// vi.mock factory above but not directly invoked in every test).
void generateStorageKey;
