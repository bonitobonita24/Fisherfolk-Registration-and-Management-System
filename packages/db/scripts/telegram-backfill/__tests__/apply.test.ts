/**
 * Unit tests — apply.ts applyToDemo() / applyToProd() (Phase B).
 */

import { describe, expect, it, vi } from "vitest";

import {
  applyToDemo,
  applyToProd,
  type DemoApplyPrismaClient,
  type MediaObjectUpsertArgs,
  type ProdApplyPrismaClient,
  type ProdFisherfolkRow,
  type ProdVesselRow,
} from "../apply";
import type { Manifest } from "../manifest";

const BASE_MANIFEST: Manifest = {
  createdAt: "2026-07-14T00:00:00.000Z",
  sourceTenantId: "tenant-source",
  chatId: "-100999",
  entries: [
    {
      idNumber: "MR-CL-000001-2020",
      recordId: "ff-1",
      entityType: "fisherfolk-photo",
      sourceStorageKey: "tenant-source/fisherfolk-photo/a.jpg",
      telegramFileId: "file-a",
      telegramMessageId: "11",
      sizeBytes: 500,
      mimeType: "image/jpeg",
      ext: ".jpg",
    },
    {
      idNumber: null,
      recordId: "MFVR-001",
      entityType: "vessel-photo",
      sourceStorageKey: "tenant-source/vessel-photo/b.jpg",
      telegramFileId: "file-b",
      telegramMessageId: "12",
      sizeBytes: 700,
      mimeType: "image/jpeg",
      ext: ".jpg",
    },
  ],
};

describe("applyToDemo", () => {
  it("upserts a MediaObject by tenantId_storageKey for every entry", async () => {
    const upsert = vi.fn((args: MediaObjectUpsertArgs) => Promise.resolve(args));
    const prisma: DemoApplyPrismaClient = { mediaObject: { upsert } };

    const result = await applyToDemo({ prisma, manifest: BASE_MANIFEST, tenantId: "tenant-demo" });

    expect(result.upserted).toBe(2);
    expect(upsert).toHaveBeenCalledTimes(2);
    const firstCall = upsert.mock.calls[0]?.[0];
    expect(firstCall?.where.tenantId_storageKey).toEqual({
      tenantId: "tenant-demo",
      storageKey: "tenant-source/fisherfolk-photo/a.jpg",
    });
    expect(firstCall?.create["telegramFileId"]).toBe("file-a");
    expect(firstCall?.create["backend"]).toBe("telegram");
  });
});

describe("applyToProd", () => {
  const manifest = BASE_MANIFEST;

  function makeProdPrisma(opts: {
    fisherfolkRow?: ProdFisherfolkRow | null;
    vesselRow?: ProdVesselRow | null;
  }): {
    prisma: ProdApplyPrismaClient;
    fisherfolkUpdate: ReturnType<typeof vi.fn>;
    vesselUpdate: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  } {
    const fisherfolkUpdate = vi.fn(() => Promise.resolve({}));
    const vesselUpdate = vi.fn(() => Promise.resolve({}));
    const upsert = vi.fn((args: MediaObjectUpsertArgs) => Promise.resolve(args));

    const prisma: ProdApplyPrismaClient = {
      mediaObject: { upsert },
      fisherfolk: {
        findUnique: () => Promise.resolve(opts.fisherfolkRow ?? null),
        update: fisherfolkUpdate,
      },
      vessel: {
        findUnique: () => Promise.resolve(opts.vesselRow ?? null),
        update: vesselUpdate,
      },
    };

    return { prisma, fisherfolkUpdate, vesselUpdate, upsert };
  }

  it("throws without confirm:true", async () => {
    const { prisma } = makeProdPrisma({});
    await expect(
      applyToProd({ prisma, manifest, prodTenantId: "tenant-prod", confirm: false }),
    ).rejects.toThrow(/confirm:true/);
  });

  it("matches fisherfolk by idNumber, sets only null fields, mints a prod key", async () => {
    const { prisma, fisherfolkUpdate, vesselUpdate, upsert } = makeProdPrisma({
      fisherfolkRow: { id: "prod-ff-1", photo: null, signature: null },
      vesselRow: { id: "prod-v-1", vesselPhoto: null },
    });

    const result = await applyToProd({
      prisma,
      manifest,
      prodTenantId: "tenant-prod",
      confirm: true,
    });

    expect(result.matched).toBe(2);
    expect(result.updated).toBe(2);
    expect(result.skippedUnmatched).toBe(0);
    expect(result.skippedAlreadySet).toBe(0);

    expect(fisherfolkUpdate).toHaveBeenCalledTimes(1);
    const ffCall = fisherfolkUpdate.mock.calls[0]?.[0] as {
      where: { id: string };
      data: Record<string, unknown>;
    };
    expect(ffCall.where.id).toBe("prod-ff-1");
    expect(typeof ffCall.data["photo"]).toBe("string");
    expect((ffCall.data["photo"] as string).startsWith("tenant-prod/fisherfolk-photo/")).toBe(true);
    expect((ffCall.data["photo"] as string).endsWith(".jpg")).toBe(true);

    expect(vesselUpdate).toHaveBeenCalledTimes(1);
    const vCall = vesselUpdate.mock.calls[0]?.[0] as {
      where: { id: string };
      data: Record<string, unknown>;
    };
    expect(vCall.where.id).toBe("prod-v-1");
    expect((vCall.data["vesselPhoto"] as string).startsWith("tenant-prod/vessel-photo/")).toBe(true);

    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("does not overwrite an already-set field, counts skippedAlreadySet", async () => {
    const { prisma, fisherfolkUpdate, vesselUpdate } = makeProdPrisma({
      fisherfolkRow: { id: "prod-ff-1", photo: "tenant-prod/fisherfolk-photo/existing.jpg", signature: null },
      vesselRow: { id: "prod-v-1", vesselPhoto: "tenant-prod/vessel-photo/existing.jpg" },
    });

    const result = await applyToProd({
      prisma,
      manifest,
      prodTenantId: "tenant-prod",
      confirm: true,
    });

    expect(result.matched).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.skippedAlreadySet).toBe(2);
    expect(fisherfolkUpdate).not.toHaveBeenCalled();
    expect(vesselUpdate).not.toHaveBeenCalled();
  });

  it("counts skippedUnmatched when no prod record matches the business key", async () => {
    const { prisma } = makeProdPrisma({ fisherfolkRow: null, vesselRow: null });

    const result = await applyToProd({
      prisma,
      manifest,
      prodTenantId: "tenant-prod",
      confirm: true,
    });

    expect(result.matched).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.skippedUnmatched).toBe(2);
  });
});
