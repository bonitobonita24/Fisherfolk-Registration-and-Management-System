/**
 * upload.ts — Phase A of the Telegram photo-backfill tool.
 *
 * Enumerates existing fisherfolk photos/signatures and vessel photos for a
 * given tenant, downloads each file's bytes from MinIO/S3, re-uploads them
 * to a Telegram chat via `uploadDocumentToTelegram`, and records the result
 * in a resumable `Manifest`. Never writes to the database — Phase A is
 * read-from-S3 + write-to-Telegram only. Phase B (apply.ts) is the only
 * step that touches Prisma writes.
 */

import { extname } from "node:path";
import type { S3Client } from "@aws-sdk/client-s3";
import { uploadDocumentToTelegram } from "@frms/storage";

import type { BackfillEntityType, Manifest, ManifestEntry } from "./manifest";
import { getObjectBytes } from "./s3-bytes";

// ---------------------------------------------------------------------------
// Narrow Prisma surface — only what this module reads. Kept intentionally
// small (rather than importing the generated PrismaClient type) so tests can
// supply a lightweight mock without instantiating a real client.
// ---------------------------------------------------------------------------

export interface FisherfolkPhotoRow {
  id: string;
  idNumber: string;
  photo: string | null;
  signature: string | null;
}

export interface VesselPhotoRow {
  id: string;
  mfvrNumber: string;
  vesselPhoto: string | null;
}

export interface UploadPrismaClient {
  fisherfolk: {
    findMany(args: {
      where: { tenantId: string; OR: Array<Record<string, unknown>> };
    }): Promise<FisherfolkPhotoRow[]>;
  };
  vessel: {
    findMany(args: {
      where: { tenantId: string; vesselPhoto: { not: null } };
    }): Promise<VesselPhotoRow[]>;
  };
}

export interface RunUploadOptions {
  prisma: UploadPrismaClient;
  s3: S3Client;
  bucket: string;
  tenantId: string;
  chatId: string;
  botToken: string;
  /** Cap the number of assets uploaded this run (sampling / dry-run). */
  limit?: number;
  /** Restrict to a single entity type. */
  entityFilter?: BackfillEntityType;
  /** A previously-saved manifest to resume from — already-uploaded storageKeys are skipped. */
  existing?: Manifest;
  /** Delay between uploads in ms, to stay within Telegram's rate limits. Default 350ms. */
  throttleMs?: number;
  log?: (msg: string) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

interface CandidateAsset {
  idNumber: string | null;
  recordId: string;
  entityType: BackfillEntityType;
  storageKey: string;
}

async function collectCandidates(
  prisma: UploadPrismaClient,
  tenantId: string,
  entityFilter: BackfillEntityType | undefined,
): Promise<CandidateAsset[]> {
  const candidates: CandidateAsset[] = [];

  const wantsFisherfolk =
    entityFilter === undefined ||
    entityFilter === "fisherfolk-photo" ||
    entityFilter === "fisherfolk-signature";
  const wantsVessel = entityFilter === undefined || entityFilter === "vessel-photo";

  if (wantsFisherfolk) {
    const rows = await prisma.fisherfolk.findMany({
      where: {
        tenantId,
        OR: [{ photo: { not: null } }, { signature: { not: null } }],
      },
    });
    for (const row of rows) {
      if (
        row.photo !== null &&
        row.photo !== "" &&
        (entityFilter === undefined || entityFilter === "fisherfolk-photo")
      ) {
        candidates.push({
          idNumber: row.idNumber,
          recordId: row.id,
          entityType: "fisherfolk-photo",
          storageKey: row.photo,
        });
      }
      if (
        row.signature !== null &&
        row.signature !== "" &&
        (entityFilter === undefined || entityFilter === "fisherfolk-signature")
      ) {
        candidates.push({
          idNumber: row.idNumber,
          recordId: row.id,
          entityType: "fisherfolk-signature",
          storageKey: row.signature,
        });
      }
    }
  }

  if (wantsVessel) {
    const rows = await prisma.vessel.findMany({
      where: { tenantId, vesselPhoto: { not: null } },
    });
    for (const row of rows) {
      if (row.vesselPhoto !== null && row.vesselPhoto !== "") {
        candidates.push({
          // Vessels match on `mfvrNumber` (Vessel.@@unique([tenantId,
          // mfvrNumber])), not idNumber — see ManifestEntry.recordId doc.
          idNumber: null,
          recordId: row.mfvrNumber,
          entityType: "vessel-photo",
          storageKey: row.vesselPhoto,
        });
      }
    }
  }

  return candidates;
}

/**
 * Phase A: upload existing MinIO/S3-stored media to Telegram and build a
 * resumable manifest. Any entry whose `sourceStorageKey` is already present
 * in `opts.existing` is skipped (resume support).
 */
export async function runUpload(opts: RunUploadOptions): Promise<Manifest> {
  const {
    prisma,
    s3,
    bucket,
    tenantId,
    chatId,
    botToken,
    limit,
    entityFilter,
    existing,
    throttleMs = 350,
    log = () => {},
  } = opts;

  const alreadyDone = new Set(existing?.entries.map((e) => e.sourceStorageKey) ?? []);
  const entries: ManifestEntry[] = existing !== undefined ? [...existing.entries] : [];

  const candidates = await collectCandidates(prisma, tenantId, entityFilter);

  let uploadedCount = 0;
  for (const candidate of candidates) {
    if (limit !== undefined && uploadedCount >= limit) {
      break;
    }
    if (alreadyDone.has(candidate.storageKey)) {
      log(`skip (already migrated): ${candidate.storageKey}`);
      continue;
    }

    const ext = extname(candidate.storageKey);
    const mimeType = mimeFromExt(ext);

    const bytes = await getObjectBytes(s3, bucket, candidate.storageKey);
    const { messageId, fileId } = await uploadDocumentToTelegram({
      botToken,
      chatId,
      bytes: new Uint8Array(bytes),
      filename: candidate.storageKey.split("/").pop() ?? `asset${ext}`,
      mimeType,
      caption: `${tenantId} · ${candidate.entityType} · ${candidate.storageKey}`,
    });

    entries.push({
      idNumber: candidate.idNumber,
      recordId: candidate.recordId,
      entityType: candidate.entityType,
      sourceStorageKey: candidate.storageKey,
      telegramFileId: fileId,
      telegramMessageId: String(messageId),
      sizeBytes: bytes.length,
      mimeType,
      ext,
    });

    uploadedCount++;
    log(`uploaded (${String(uploadedCount)}): ${candidate.storageKey} -> fileId=${fileId}`);

    if (throttleMs > 0) {
      await sleep(throttleMs);
    }
  }

  return {
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    sourceTenantId: tenantId,
    chatId,
    entries,
  };
}
