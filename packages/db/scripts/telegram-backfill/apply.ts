/**
 * apply.ts — Phase B of the Telegram photo-backfill tool.
 *
 * Consumes a Manifest produced by upload.ts (Phase A) and writes
 * `MediaObject` ledger rows (+ for prod, mints fresh storage keys onto the
 * matching fisherfolk/vessel record when the target field is still empty).
 *
 * Two entrypoints, deliberately asymmetric:
 *  - `applyToDemo`: the demo tenant's records already reference the SAME
 *    `sourceStorageKey` the manifest was built against, so this is a plain
 *    upsert-by-storageKey ledger write. No fisherfolk/vessel field is
 *    touched.
 *  - `applyToProd`: prod is a DIFFERENT tenant with its own row ids and
 *    (possibly) its own storageKeys, so records are matched by durable
 *    business key (`idNumber` for fisherfolk, `mfvrNumber` for vessels — see
 *    manifest.ts `ManifestEntry.recordId` doc), a FRESH prod-tenant storage
 *    key is minted, and the target photo/signature/vesselPhoto field is set
 *    ONLY if it is currently null (never overwrites an existing prod
 *    asset). Requires an explicit `confirm: true` — this mutates production
 *    fisherfolk/vessel rows and is the one irreversible step in the tool.
 */

import { createHash } from "node:crypto";

import { resendDocumentToTelegram } from "@frms/storage";

import type { Manifest, ManifestEntry } from "./manifest";

// ---------------------------------------------------------------------------
// Narrow Prisma surfaces
// ---------------------------------------------------------------------------

export interface MediaObjectUpsertArgs {
  where: { tenantId_storageKey: { tenantId: string; storageKey: string } };
  create: Record<string, unknown>;
  update: Record<string, unknown>;
}

export interface DemoApplyPrismaClient {
  mediaObject: {
    upsert(args: MediaObjectUpsertArgs): Promise<unknown>;
  };
}

export interface ProdFisherfolkRow {
  id: string;
  photo: string | null;
  signature: string | null;
}

export interface ProdVesselRow {
  id: string;
  vesselPhoto: string | null;
}

export interface ProdApplyPrismaClient {
  mediaObject: {
    upsert(args: MediaObjectUpsertArgs): Promise<unknown>;
  };
  fisherfolk: {
    findUnique(args: {
      where: { tenantId_idNumber: { tenantId: string; idNumber: string } };
    }): Promise<ProdFisherfolkRow | null>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  };
  vessel: {
    findUnique(args: {
      where: { tenantId_mfvrNumber: { tenantId: string; mfvrNumber: string } };
    }): Promise<ProdVesselRow | null>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  };
}

// ---------------------------------------------------------------------------
// applyToDemo
// ---------------------------------------------------------------------------

export interface ApplyToDemoOptions {
  prisma: DemoApplyPrismaClient;
  manifest: Manifest;
  tenantId: string;
  log?: (msg: string) => void;
}

export interface ApplyToDemoResult {
  upserted: number;
}

function mediaObjectFieldsFromEntry(entry: ManifestEntry, chatId: string): Record<string, unknown> {
  return {
    entityType: entry.entityType,
    backend: "telegram",
    telegramChatId: chatId,
    telegramFileId: entry.telegramFileId,
    telegramMessageId: BigInt(entry.telegramMessageId),
    sizeBytes: entry.sizeBytes,
    mimeType: entry.mimeType,
    migratedAt: new Date(),
  };
}

/**
 * Phase B (demo path): the demo tenant's fisherfolk/vessel rows already
 * point at `entry.sourceStorageKey` — this only writes the MediaObject
 * ledger row so the storage layer's TelegramAdapter can resolve it.
 */
export async function applyToDemo(opts: ApplyToDemoOptions): Promise<ApplyToDemoResult> {
  const { prisma, manifest, tenantId, log = () => {} } = opts;

  let upserted = 0;
  for (const entry of manifest.entries) {
    const fields = mediaObjectFieldsFromEntry(entry, manifest.chatId);

    await prisma.mediaObject.upsert({
      where: { tenantId_storageKey: { tenantId, storageKey: entry.sourceStorageKey } },
      create: { tenantId, storageKey: entry.sourceStorageKey, ...fields },
      update: fields,
    });

    upserted++;
    log(`upserted MediaObject: ${entry.sourceStorageKey}`);
  }

  return { upserted };
}

// ---------------------------------------------------------------------------
// applyToProd
// ---------------------------------------------------------------------------

export interface ApplyToProdOptions {
  prisma: ProdApplyPrismaClient;
  manifest: Manifest;
  prodTenantId: string;
  /** Hard safety gate — throws unless explicitly true. */
  confirm: boolean;
  log?: (msg: string) => void;
}

export interface ApplyToProdResult {
  matched: number;
  updated: number;
  skippedUnmatched: number;
  skippedAlreadySet: number;
}

function mintProdKey(prodTenantId: string, entityType: string, entry: ManifestEntry): string {
  const hash = createHash("md5").update(entry.telegramFileId).digest("hex");
  return `${prodTenantId}/${entityType}/${hash}${entry.ext}`;
}

/**
 * Phase B (prod path): matches each manifest entry to a prod record by
 * business key, mints a fresh prod-tenant storage key, sets the target field
 * ONLY when it is currently null, and writes the MediaObject ledger row for
 * the new key. Never overwrites an existing prod photo/signature.
 *
 * @throws if `confirm` is not exactly `true` — this mutates production data.
 */
export async function applyToProd(opts: ApplyToProdOptions): Promise<ApplyToProdResult> {
  const { prisma, manifest, prodTenantId, confirm, log = () => {} } = opts;

  if (confirm !== true) {
    throw new Error("prod apply requires confirm:true");
  }

  const result: ApplyToProdResult = {
    matched: 0,
    updated: 0,
    skippedUnmatched: 0,
    skippedAlreadySet: 0,
  };

  for (const entry of manifest.entries) {
    if (entry.entityType === "vessel-photo") {
      const vessel = await prisma.vessel.findUnique({
        where: { tenantId_mfvrNumber: { tenantId: prodTenantId, mfvrNumber: entry.recordId } },
      });
      if (vessel === null) {
        result.skippedUnmatched++;
        log(`skip (no prod vessel match): mfvrNumber=${entry.recordId}`);
        continue;
      }
      result.matched++;

      if (vessel.vesselPhoto !== null && vessel.vesselPhoto !== "") {
        result.skippedAlreadySet++;
        log(`skip (vesselPhoto already set): mfvrNumber=${entry.recordId}`);
        continue;
      }

      const newKey = mintProdKey(prodTenantId, entry.entityType, entry);
      await prisma.vessel.update({ where: { id: vessel.id }, data: { vesselPhoto: newKey } });
      await upsertProdMediaObject(prisma, prodTenantId, newKey, entry, manifest.chatId);
      result.updated++;
      log(`updated vessel.vesselPhoto: mfvrNumber=${entry.recordId} -> ${newKey}`);
      continue;
    }

    // fisherfolk-photo / fisherfolk-signature
    if (entry.idNumber === null) {
      result.skippedUnmatched++;
      log(`skip (no idNumber on entry): recordId=${entry.recordId}`);
      continue;
    }

    const fisherfolk = await prisma.fisherfolk.findUnique({
      where: { tenantId_idNumber: { tenantId: prodTenantId, idNumber: entry.idNumber } },
    });
    if (fisherfolk === null) {
      result.skippedUnmatched++;
      log(`skip (no prod fisherfolk match): idNumber=${entry.idNumber}`);
      continue;
    }
    result.matched++;

    const targetField = entry.entityType === "fisherfolk-photo" ? "photo" : "signature";
    const currentValue = fisherfolk[targetField];
    if (currentValue !== null && currentValue !== "") {
      result.skippedAlreadySet++;
      log(`skip (${targetField} already set): idNumber=${entry.idNumber}`);
      continue;
    }

    const newKey = mintProdKey(prodTenantId, entry.entityType, entry);
    await prisma.fisherfolk.update({
      where: { id: fisherfolk.id },
      data: { [targetField]: newKey },
    });
    await upsertProdMediaObject(prisma, prodTenantId, newKey, entry, manifest.chatId);
    result.updated++;
    log(`updated fisherfolk.${targetField}: idNumber=${entry.idNumber} -> ${newKey}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// applyToDev
// ---------------------------------------------------------------------------

export interface DevFisherfolkRow {
  id: string;
  photo: string | null;
  signature: string | null;
}

export interface DevApplyPrismaClient {
  mediaObject: {
    upsert(args: MediaObjectUpsertArgs): Promise<unknown>;
  };
  fisherfolk: {
    findUnique(args: {
      where: { tenantId_idNumber: { tenantId: string; idNumber: string } };
    }): Promise<DevFisherfolkRow | null>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  };
}

export interface ApplyToDevOptions {
  prisma: DevApplyPrismaClient;
  manifest: Manifest;
  /** The local-dev tenant whose fisherfolk rows are being filled. */
  tenantId: string;
  /** The dedicated dev Telegram channel — assets are re-sent here, never to the manifest's source channel. */
  chatId: string;
  botToken: string;
  /** Delay (ms) between resends, to stay well under Telegram rate limits. Default 1500. */
  throttleMs?: number;
  /** Cap the number of entries processed (useful for a first smoke run). */
  limit?: number;
  log?: (msg: string) => void;
}

export interface ApplyToDevResult {
  matched: number;
  filled: number;
  resent: number;
  skippedNoMatch: number;
  skippedAlready: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Phase B (dev path, Approach A): re-sends each fisherfolk-photo /
 * fisherfolk-signature asset from the manifest's source Telegram channel
 * into a DEDICATED dev channel (by `file_id`, so Telegram copies the file
 * server-side — no byte re-upload), then writes the dev media_objects
 * ledger row and fills the matching dev fisherfolk's photo/signature field
 * ONLY if it is currently null. Vessel-photo entries are skipped — local
 * dev carries no vessel data. Resumable: an entry whose target field is
 * already set is skipped without re-sending.
 */
export async function applyToDev(opts: ApplyToDevOptions): Promise<ApplyToDevResult> {
  const {
    prisma,
    manifest,
    tenantId,
    chatId,
    botToken,
    throttleMs = 1500,
    limit,
    log = () => {},
  } = opts;

  const result: ApplyToDevResult = {
    matched: 0,
    filled: 0,
    resent: 0,
    skippedNoMatch: 0,
    skippedAlready: 0,
  };

  let processed = 0;
  for (const entry of manifest.entries) {
    if (limit !== undefined && processed >= limit) {
      break;
    }

    if (entry.entityType === "vessel-photo") {
      continue;
    }

    if (entry.idNumber === null) {
      result.skippedNoMatch++;
      log(`skip (no idNumber on entry): recordId=${entry.recordId}`);
      continue;
    }

    const fisherfolk = await prisma.fisherfolk.findUnique({
      where: { tenantId_idNumber: { tenantId, idNumber: entry.idNumber } },
    });
    if (fisherfolk === null) {
      result.skippedNoMatch++;
      log(`skip (no dev fisherfolk match): idNumber=${entry.idNumber}`);
      continue;
    }
    result.matched++;

    const targetField = entry.entityType === "fisherfolk-photo" ? "photo" : "signature";
    const currentValue = fisherfolk[targetField];
    if (currentValue !== null && currentValue !== "") {
      result.skippedAlready++;
      log(`skip (${targetField} already set): idNumber=${entry.idNumber}`);
      continue;
    }

    const { messageId, fileId } = await resendDocumentToTelegram({
      botToken,
      chatId,
      fileId: entry.telegramFileId,
      caption: `${tenantId} · ${entry.entityType} · ${entry.idNumber}`,
      // Long unattended run over a flaky IPv6 route — retry transient network
      // errors generously so a single ETIMEDOUT never aborts the whole backfill.
      maxRetries: 10,
    });
    result.resent++;

    const newKey = mintProdKey(tenantId, entry.entityType, entry);
    const fields = mediaObjectFieldsFromEntry(entry, chatId);
    fields["telegramMessageId"] = BigInt(messageId);
    fields["telegramFileId"] = fileId;

    await prisma.mediaObject.upsert({
      where: { tenantId_storageKey: { tenantId, storageKey: newKey } },
      create: { tenantId, storageKey: newKey, ...fields },
      update: fields,
    });

    await prisma.fisherfolk.update({
      where: { id: fisherfolk.id },
      data: { [targetField]: newKey },
    });
    result.filled++;
    log(`filled dev fisherfolk.${targetField}: idNumber=${entry.idNumber} -> ${newKey}`);

    processed++;
    if (throttleMs > 0) {
      await sleep(throttleMs);
    }
  }

  return result;
}

async function upsertProdMediaObject(
  prisma: ProdApplyPrismaClient,
  prodTenantId: string,
  newKey: string,
  entry: ManifestEntry,
  chatId: string,
): Promise<void> {
  const fields = mediaObjectFieldsFromEntry(entry, chatId);
  await prisma.mediaObject.upsert({
    where: { tenantId_storageKey: { tenantId: prodTenantId, storageKey: newKey } },
    create: { tenantId: prodTenantId, storageKey: newKey, ...fields },
    update: fields,
  });
}
