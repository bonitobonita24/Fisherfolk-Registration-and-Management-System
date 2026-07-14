/**
 * Unit tests — apps/web/src/server/lib/media-bytes.ts
 *
 * Covers:
 *  1. Telegram success → { source: "telegram" }.
 *  2. Telegram throws → falls back to MinIO → { source: "minio" }.
 *  3. No telegramFileId → goes straight to MinIO.
 *  4. Both fail → throws.
 *
 * @frms/storage is mocked; MinIO fallback is exercised via a mocked global fetch.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@frms/storage", () => ({
  fetchTelegramFileBytes: vi.fn(),
  getTelegramBotToken: vi.fn(() => "test-bot-token"),
  getFileDownloadUrl: vi.fn(() =>
    Promise.resolve("https://minio.example.com/bucket/signed?X-Amz-Signature=abc"),
  ),
}));

import {
  fetchTelegramFileBytes,
  getFileDownloadUrl,
} from "@frms/storage";
import { resolveMediaBytes } from "../media-bytes";

const mockedFetchTelegramFileBytes = vi.mocked(fetchTelegramFileBytes);
const mockedGetFileDownloadUrl = vi.mocked(getFileDownloadUrl);

const originalFetch = global.fetch;

describe("resolveMediaBytes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetFileDownloadUrl.mockResolvedValue(
      "https://minio.example.com/bucket/signed?X-Amz-Signature=abc",
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns source=telegram on Telegram success", async () => {
    mockedFetchTelegramFileBytes.mockResolvedValue({
      bytes: new TextEncoder().encode("hello-telegram").buffer,
      filePath: "documents/file_1.jpg",
    });

    const result = await resolveMediaBytes({
      tenantId: "tenant-1",
      storageKey: "tenant-1/fisherfolk-photo/abc.jpg",
      telegramFileId: "tg-file-id-123",
    });

    expect(result.source).toBe("telegram");
    expect(result.bytes.toString()).toBe("hello-telegram");
    expect(mockedFetchTelegramFileBytes).toHaveBeenCalledWith({
      botToken: "test-bot-token",
      fileId: "tg-file-id-123",
    });
    expect(mockedGetFileDownloadUrl).not.toHaveBeenCalled();
  });

  it("falls back to MinIO when Telegram fetch throws", async () => {
    mockedFetchTelegramFileBytes.mockRejectedValue(
      new Error("Telegram getFile failed: file not found"),
    );
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        arrayBuffer: () =>
          Promise.resolve(new TextEncoder().encode("hello-minio").buffer),
      } as unknown as Response),
    );

    const result = await resolveMediaBytes({
      tenantId: "tenant-1",
      storageKey: "tenant-1/fisherfolk-photo/abc.jpg",
      telegramFileId: "tg-file-id-123",
    });

    expect(result.source).toBe("minio");
    expect(result.bytes.toString()).toBe("hello-minio");
    expect(mockedFetchTelegramFileBytes).toHaveBeenCalledTimes(1);
    expect(mockedGetFileDownloadUrl).toHaveBeenCalledWith(
      "tenant-1/fisherfolk-photo/abc.jpg",
      "tenant-1",
    );
  });

  it("goes straight to MinIO when telegramFileId is null", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        arrayBuffer: () =>
          Promise.resolve(new TextEncoder().encode("hello-minio-direct").buffer),
      } as unknown as Response),
    );

    const result = await resolveMediaBytes({
      tenantId: "tenant-1",
      storageKey: "tenant-1/fisherfolk-photo/abc.jpg",
      telegramFileId: null,
    });

    expect(result.source).toBe("minio");
    expect(result.bytes.toString()).toBe("hello-minio-direct");
    expect(mockedFetchTelegramFileBytes).not.toHaveBeenCalled();
  });

  it("throws when both Telegram and MinIO fail", async () => {
    mockedFetchTelegramFileBytes.mockRejectedValue(new Error("telegram down"));
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: "Not Found",
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      } as unknown as Response),
    );

    await expect(
      resolveMediaBytes({
        tenantId: "tenant-1",
        storageKey: "tenant-1/fisherfolk-photo/abc.jpg",
        telegramFileId: "tg-file-id-123",
      }),
    ).rejects.toThrow(/both Telegram and MinIO fetch failed/);
  });
});
