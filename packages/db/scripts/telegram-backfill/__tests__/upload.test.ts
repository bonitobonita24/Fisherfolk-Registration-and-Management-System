/**
 * Unit tests — upload.ts runUpload() (Phase A).
 *
 * Mocks the narrow Prisma surface, getObjectBytes, and
 * uploadDocumentToTelegram (@frms/storage) — no network/DB access.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { S3Client } from "@aws-sdk/client-s3";

vi.mock("@frms/storage", () => ({
  uploadDocumentToTelegram: vi.fn(),
}));

vi.mock("../s3-bytes", () => ({
  getObjectBytes: vi.fn(),
}));

import { uploadDocumentToTelegram } from "@frms/storage";
import { getObjectBytes } from "../s3-bytes";
import { runUpload, type UploadPrismaClient } from "../upload";
import type { Manifest } from "../manifest";

const mockUpload = vi.mocked(uploadDocumentToTelegram);
const mockGetBytes = vi.mocked(getObjectBytes);

function makePrisma(overrides?: {
  fisherfolk?: UploadPrismaClient["fisherfolk"]["findMany"];
  vessel?: UploadPrismaClient["vessel"]["findMany"];
}): UploadPrismaClient {
  return {
    fisherfolk: { findMany: overrides?.fisherfolk ?? (() => Promise.resolve([])) },
    vessel: { findMany: overrides?.vessel ?? (() => Promise.resolve([])) },
  };
}

const FAKE_S3 = {} as unknown as S3Client;

describe("runUpload", () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockGetBytes.mockReset();
  });

  it("enumerates fisherfolk photos, signatures, and vessel photos", async () => {
    const prisma = makePrisma({
      fisherfolk: () =>
        Promise.resolve([
          {
            id: "ff-1",
            idNumber: "MR-CL-000001-2020",
            photo: "tenant-1/fisherfolk-photo/a.jpg",
            signature: "tenant-1/fisherfolk-signature/b.png",
          },
        ]),
      vessel: () =>
        Promise.resolve([
          { id: "v-1", mfvrNumber: "MFVR-001", vesselPhoto: "tenant-1/vessel-photo/c.webp" },
        ]),
    });

    mockGetBytes.mockResolvedValue(Buffer.from("bytes"));
    mockUpload.mockResolvedValue({ messageId: 1, fileId: "file-1" });

    const manifest = await runUpload({
      prisma,
      s3: FAKE_S3,
      bucket: "bucket",
      tenantId: "tenant-1",
      chatId: "-100",
      botToken: "token",
      throttleMs: 0,
    });

    expect(manifest.entries).toHaveLength(3);
    const entityTypes = manifest.entries.map((e) => e.entityType).sort();
    expect(entityTypes).toEqual(["fisherfolk-photo", "fisherfolk-signature", "vessel-photo"]);

    const vesselEntry = manifest.entries.find((e) => e.entityType === "vessel-photo");
    expect(vesselEntry?.idNumber).toBeNull();
    expect(vesselEntry?.recordId).toBe("MFVR-001");

    const photoEntry = manifest.entries.find((e) => e.entityType === "fisherfolk-photo");
    expect(photoEntry?.idNumber).toBe("MR-CL-000001-2020");
    expect(photoEntry?.mimeType).toBe("image/jpeg");

    expect(mockUpload).toHaveBeenCalledTimes(3);
  });

  it("respects the limit option", async () => {
    const prisma = makePrisma({
      fisherfolk: () =>
        Promise.resolve([
          { id: "ff-1", idNumber: "A", photo: "t/fisherfolk-photo/a.jpg", signature: null },
          { id: "ff-2", idNumber: "B", photo: "t/fisherfolk-photo/b.jpg", signature: null },
          { id: "ff-3", idNumber: "C", photo: "t/fisherfolk-photo/c.jpg", signature: null },
        ]),
    });

    mockGetBytes.mockResolvedValue(Buffer.from("bytes"));
    mockUpload.mockResolvedValue({ messageId: 1, fileId: "file-1" });

    const manifest = await runUpload({
      prisma,
      s3: FAKE_S3,
      bucket: "bucket",
      tenantId: "t",
      chatId: "-100",
      botToken: "token",
      limit: 2,
      throttleMs: 0,
    });

    expect(manifest.entries).toHaveLength(2);
  });

  it("skips storageKeys already present in an existing manifest (resume)", async () => {
    const prisma = makePrisma({
      fisherfolk: () =>
        Promise.resolve([
          { id: "ff-1", idNumber: "A", photo: "t/fisherfolk-photo/a.jpg", signature: null },
          { id: "ff-2", idNumber: "B", photo: "t/fisherfolk-photo/b.jpg", signature: null },
        ]),
    });

    mockGetBytes.mockResolvedValue(Buffer.from("bytes"));
    mockUpload.mockResolvedValue({ messageId: 2, fileId: "file-2" });

    const existing: Manifest = {
      createdAt: "2026-01-01T00:00:00.000Z",
      sourceTenantId: "t",
      chatId: "-100",
      entries: [
        {
          idNumber: "A",
          recordId: "ff-1",
          entityType: "fisherfolk-photo",
          sourceStorageKey: "t/fisherfolk-photo/a.jpg",
          telegramFileId: "file-1",
          telegramMessageId: "1",
          sizeBytes: 100,
          mimeType: "image/jpeg",
          ext: ".jpg",
        },
      ],
    };

    const manifest = await runUpload({
      prisma,
      s3: FAKE_S3,
      bucket: "bucket",
      tenantId: "t",
      chatId: "-100",
      botToken: "token",
      existing,
      throttleMs: 0,
    });

    // Existing entry preserved + only the new one uploaded.
    expect(manifest.entries).toHaveLength(2);
    expect(mockUpload).toHaveBeenCalledTimes(1);
    const newEntry = manifest.entries.find((e) => e.recordId === "ff-2");
    expect(newEntry?.telegramFileId).toBe("file-2");
    // createdAt preserved from the existing manifest.
    expect(manifest.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("respects entityFilter", async () => {
    const prisma = makePrisma({
      fisherfolk: () =>
        Promise.resolve([
          {
            id: "ff-1",
            idNumber: "A",
            photo: "t/fisherfolk-photo/a.jpg",
            signature: "t/fisherfolk-signature/a.png",
          },
        ]),
      vessel: () =>
        Promise.resolve([{ id: "v-1", mfvrNumber: "MFVR-1", vesselPhoto: "t/vessel-photo/x.jpg" }]),
    });

    mockGetBytes.mockResolvedValue(Buffer.from("bytes"));
    mockUpload.mockResolvedValue({ messageId: 1, fileId: "file-1" });

    const manifest = await runUpload({
      prisma,
      s3: FAKE_S3,
      bucket: "bucket",
      tenantId: "t",
      chatId: "-100",
      botToken: "token",
      entityFilter: "fisherfolk-signature",
      throttleMs: 0,
    });

    expect(manifest.entries).toHaveLength(1);
    expect(manifest.entries[0]?.entityType).toBe("fisherfolk-signature");
  });
});
