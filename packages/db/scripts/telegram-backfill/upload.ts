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
  /**
   * Called after every successful upload with the current (in-progress)
   * manifest, so the caller can persist it incrementally. This makes the
   * operation crash-safe: if the process dies mid-run, the last-saved manifest
   * already records every upload completed so far, so `--resume` skips them
   * (avoiding permanent duplicate Telegram messages).
   */
  onProgress?: (manifest: Manifest) => void;
  log?: (msg: string) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Per-network-operation timeout. The original tool had NO timeout on either
// getObjectBytes or the Telegram upload, so a single hung socket froze the
// entire multi-thousand-object run indefinitely. Every individual network
// operation (each S3 fetch, each single Telegram upload attempt) is now
// bounded: if it exceeds this budget it is aborted as an error, the item is
// skipped, and the run continues. A skipped item is simply absent from the
// manifest, so a later `--resume` retries it with a fresh attempt.
const ITEM_TIMEOUT_MS = 60_000;

/**
 * Race a promise against a rejecting timer so a hung operation cannot stall the
 * loop. The timer is always cleared (success or failure) so it never keeps the
 * event loop alive. Note: this bounds the WAIT, not the underlying work — for
 * S3 we additionally pass an AbortSignal so the socket is actually torn down;
 * the Telegram upload path (shared @frms/storage helper, not editable here)
 * relies on this race alone, which is sufficient to keep the loop advancing.
 */
async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${String(ms)}ms`));
    }, ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

// Bounded retry for Telegram 429 (rate-limit) on the sendDocument (upload)
// path. The shared uploadDocumentToTelegram helper throws a plain Error whose
// message carries Telegram's "Too Many Requests: retry after N" description;
// we parse the hint, back off, and retry so a transient rate-limit does not
// abort a multi-thousand-object migration.
const MAX_UPLOAD_RETRIES = 6;
const UPLOAD_BASE_BACKOFF_MS = 1000;
const UPLOAD_MAX_BACKOFF_MS = 60_000;

function isRateLimit(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /too many requests|retry after|\b429\b/i.test(msg);
}

function retryAfterMs(err: unknown): number {
  const msg = err instanceof Error ? err.message : String(err);
  const m = /retry after (\d+)/i.exec(msg);
  return m ? Number(m[1]) * 1000 : 0;
}

async function uploadWithRetry(
  params: Parameters<typeof uploadDocumentToTelegram>[0],
  log: (msg: string) => void,
): Promise<Awaited<ReturnType<typeof uploadDocumentToTelegram>>> {
  for (let attempt = 0; attempt <= MAX_UPLOAD_RETRIES; attempt++) {
    try {
      // Bound each individual upload attempt. A hung socket on a single attempt
      // times out and (not being a rate-limit) propagates out of this loop, so
      // the caller's per-item catch skips the object rather than freezing. We
      // deliberately do NOT retry a timed-out attempt: the request may have
      // reached Telegram, and retrying could create a duplicate channel
      // message — a fresh `--resume` attempt later is the safe path.
      return await withTimeout(
        uploadDocumentToTelegram(params),
        ITEM_TIMEOUT_MS,
        "telegram upload",
      );
    } catch (err) {
      const rateLimited = isRateLimit(err);
      if (!rateLimited || attempt === MAX_UPLOAD_RETRIES) {
        throw err;
      }
      const floor = UPLOAD_BASE_BACKOFF_MS * 2 ** attempt;
      const wait = Math.min(Math.max(retryAfterMs(err), floor), UPLOAD_MAX_BACKOFF_MS);
      log(
        `rate-limited (attempt ${String(attempt + 1)}/${String(MAX_UPLOAD_RETRIES)}), ` +
          `backing off ${String(wait)}ms: ${err instanceof Error ? err.message : String(err)}`,
      );
      await sleep(wait);
    }
  }
  // Unreachable — the loop either returns or throws.
  throw new Error("uploadWithRetry: exhausted retries");
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
    onProgress,
    log = () => {},
  } = opts;

  const alreadyDone = new Set(existing?.entries.map((e) => e.sourceStorageKey) ?? []);
  const entries: ManifestEntry[] = existing !== undefined ? [...existing.entries] : [];

  const manifest: Manifest = {
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    sourceTenantId: tenantId,
    chatId,
    entries,
  };

  const candidates = await collectCandidates(prisma, tenantId, entityFilter);
  const remaining = candidates.filter((c) => !alreadyDone.has(c.storageKey)).length;
  log(
    `candidates: ${String(candidates.length)} total · ${String(alreadyDone.size)} already in manifest · ` +
      `${String(remaining)} to upload this run`,
  );

  let uploadedCount = 0;
  let failedCount = 0;
  for (const candidate of candidates) {
    if (limit !== undefined && uploadedCount >= limit) {
      break;
    }
    if (alreadyDone.has(candidate.storageKey)) {
      continue;
    }

    const ext = extname(candidate.storageKey);
    const mimeType = mimeFromExt(ext);

    // Per-item try/catch: on ANY error (S3 timeout/abort, 5xx, network, a
    // non-rate-limit Telegram failure) we LOG the storageKey + reason and
    // CONTINUE to the next object rather than crashing the whole run. The
    // failed item is absent from the manifest, so a later `--resume` retries
    // it. This — together with the per-operation timeouts — is what makes a
    // single hung socket a skipped item instead of a frozen run.
    try {
      const bytes = await withTimeout(
        getObjectBytes(s3, bucket, candidate.storageKey, AbortSignal.timeout(ITEM_TIMEOUT_MS)),
        ITEM_TIMEOUT_MS,
        `s3 get ${candidate.storageKey}`,
      );
      const { messageId, fileId } = await uploadWithRetry(
        {
          botToken,
          chatId,
          bytes: new Uint8Array(bytes),
          filename: candidate.storageKey.split("/").pop() ?? `asset${ext}`,
          mimeType,
          caption: `${tenantId} · ${candidate.entityType} · ${candidate.storageKey}`,
        },
        log,
      );

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
      alreadyDone.add(candidate.storageKey);

      uploadedCount++;
      log(
        `uploaded (${String(uploadedCount)}/${String(remaining)}, total ${String(entries.length)}): ` +
          `${candidate.storageKey} -> fileId=${fileId}`,
      );

      // Persist incrementally so a mid-run crash never loses recorded uploads
      // (and never causes duplicate re-uploads on --resume).
      onProgress?.(manifest);

      if (throttleMs > 0) {
        await sleep(throttleMs);
      }
    } catch (err) {
      failedCount++;
      log(
        `FAILED (skip, will retry on --resume) ${candidate.entityType} ${candidate.storageKey}: ` +
          `${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  log(
    `run complete: ${String(uploadedCount)} uploaded this run · ${String(failedCount)} failed/skipped · ` +
      `${String(entries.length)} total in manifest`,
  );

  return manifest;
}
