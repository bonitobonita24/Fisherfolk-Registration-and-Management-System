import { randomBytes } from "node:crypto";
import { extname } from "node:path";

const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const MAGIC_BYTES: ReadonlyArray<{ mime: string; bytes: ReadonlyArray<number>; offset: number }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff], offset: 0 },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0 },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 },
];

export function validateMimeType(buffer: Buffer, declaredMime: string): { valid: boolean; detectedMime: string | null } {
  for (const entry of MAGIC_BYTES) {
    const match = entry.bytes.every(
      (byte, i) => buffer[entry.offset + i] === byte,
    );
    if (match) {
      return {
        valid: entry.mime === declaredMime && ALLOWED_MIME_TYPES.has(declaredMime),
        detectedMime: entry.mime,
      };
    }
  }
  return { valid: false, detectedMime: null };
}

export function validateFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

export function isAllowedMimeType(mime: string): boolean {
  return ALLOWED_MIME_TYPES.has(mime);
}

export function generateStorageKey(
  tenantId: string,
  entityType: string,
  originalFilename: string,
): string {
  const ext = extname(originalFilename).toLowerCase();
  const randomName = randomBytes(16).toString("hex");
  return `${tenantId}/${entityType}/${randomName}${ext}`;
}

export function extractTenantFromKey(storageKey: string): string | null {
  const firstSlash = storageKey.indexOf("/");
  if (firstSlash === -1) {
    return null;
  }
  return storageKey.substring(0, firstSlash);
}

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };
