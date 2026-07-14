/**
 * manifest.ts
 *
 * Manifest schema + load/save helpers for the two-phase Telegram
 * photo-backfill tool (see index.ts for the CLI entrypoint).
 *
 * Phase A (`upload`) enumerates existing MinIO-stored fisherfolk/vessel
 * media, uploads each file's bytes to Telegram, and records the result as a
 * `ManifestEntry`. The manifest is a portable, resumable JSON artifact — it
 * carries NO Prisma/DB dependency, so it can be produced against one
 * environment (e.g. demo/dev source data) and later applied (Phase B) to a
 * different tenant/environment (e.g. prod), matching records by durable
 * business keys (`idNumber` for fisherfolk, `mfvrNumber` for vessels) rather
 * than internal row ids.
 */

import { readFileSync, writeFileSync } from "node:fs";

export type BackfillEntityType =
  | "fisherfolk-photo"
  | "fisherfolk-signature"
  | "vessel-photo";

export interface ManifestEntry {
  /**
   * Fisherfolk business key (`idNumber`) for fisherfolk-photo /
   * fisherfolk-signature entries. Null for vessel-photo entries (vessels
   * match on `mfvrNumber`, carried directly on the entry via `recordId`
   * being the source vessel's mfvrNumber — see upload.ts).
   */
  idNumber: string | null;
  /**
   * The business key used to match this asset to a target-environment
   * record in Phase B (apply.ts):
   *  - fisherfolk-photo / fisherfolk-signature: the source fisherfolk row's
   *    `id` (informational only — matching actually uses `idNumber` above).
   *  - vessel-photo: the source vessel's `mfvrNumber` (Vessel's unique
   *    business key, `@@unique([tenantId, mfvrNumber])`) — vessels have no
   *    separate idNumber-style field, so `mfvrNumber` travels here and
   *    `idNumber` is null for these entries.
   */
  recordId: string;
  entityType: BackfillEntityType;
  /** The MinIO/S3 storageKey the bytes were read from in the source environment. */
  sourceStorageKey: string;
  telegramFileId: string;
  telegramMessageId: string;
  sizeBytes: number;
  mimeType: string;
  ext: string;
}

export interface Manifest {
  createdAt: string;
  sourceTenantId: string;
  chatId: string;
  entries: ManifestEntry[];
}

export function loadManifest(path: string): Manifest {
  const raw = readFileSync(path, "utf-8");
  const parsed = JSON.parse(raw) as Manifest;
  if (!Array.isArray(parsed.entries)) {
    throw new Error(`Manifest at "${path}" is malformed: missing "entries" array`);
  }
  return parsed;
}

export function saveManifest(path: string, manifest: Manifest): void {
  writeFileSync(path, JSON.stringify(manifest, null, 2), "utf-8");
}
