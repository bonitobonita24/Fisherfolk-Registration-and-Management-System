/**
 * IO layer for bulk import asset compression + upload.
 *
 * Compresses images to under a target byte ceiling via sharp (JPEG re-encode
 * with progressive quality stepping + width capping), then stores them in
 * object storage via the @frms/storage package.
 */

import sharp from "sharp";
import { uploadFile } from "@frms/storage";

const DEFAULT_MAX_BYTES = 200_000; // 200 KB
const MAX_WIDTH = 1200; // cap width before quality stepping
// Quality steps tried in order; if all exceed maxBytes, lowest quality is returned.
const QUALITY_STEPS = [80, 70, 60, 50, 40] as const;

/**
 * Re-encodes `buffer` as a JPEG, stepping down quality (and capping width at
 * 1200 px) until the result fits within `maxBytes`.
 *
 * Always returns a valid JPEG buffer. If even the lowest quality exceeds
 * `maxBytes`, that lowest-quality result is returned rather than failing.
 */
export async function compressImageToUnder(
  buffer: Buffer,
  maxBytes?: number,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const limit = maxBytes ?? DEFAULT_MAX_BYTES;
  let lastBuffer: Buffer = buffer;

  for (const quality of QUALITY_STEPS) {
    const compressed = await sharp(buffer)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();

    lastBuffer = compressed;

    if (compressed.length <= limit) {
      return { buffer: compressed, mimeType: "image/jpeg" };
    }
  }

  // Floor reached — return the lowest-quality attempt rather than throwing.
  return { buffer: lastBuffer, mimeType: "image/jpeg" };
}

/**
 * Compresses an imported asset image and uploads it to object storage.
 *
 * Entity types mirror what the upload router uses:
 *   kind "photo"     → entityType "fisherfolk-photo"
 *   kind "signature" → entityType "fisherfolk-signature"
 *
 * Returns the storage key of the uploaded file.
 */
export async function storeImportedAsset(params: {
  tenantId: string;
  idNumber: string;
  kind: "photo" | "signature";
  buffer: Buffer;
  originalFilename: string;
}): Promise<string> {
  const { tenantId, kind, buffer, originalFilename } = params;

  const { buffer: compressedBuffer, mimeType } =
    await compressImageToUnder(buffer);

  const entityType =
    kind === "photo" ? "fisherfolk-photo" : "fisherfolk-signature";

  const result = await uploadFile({
    tenantId,
    entityType,
    originalFilename,
    mimeType,
    buffer: compressedBuffer,
  });

  return result.key;
}
