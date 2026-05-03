import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getStorageClient, getBucket } from "./client.js";
import {
  validateMimeType,
  validateFileSize,
  generateStorageKey,
  extractTenantFromKey,
} from "./validation.js";

export interface UploadInput {
  tenantId: string;
  entityType: string;
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface UploadResult {
  key: string;
  bucket: string;
  sizeBytes: number;
  mimeType: string;
}

export async function uploadFile(input: UploadInput): Promise<UploadResult> {
  if (!validateFileSize(input.buffer.length)) {
    throw new Error(`File size ${input.buffer.length} bytes exceeds maximum allowed`);
  }

  const mimeCheck = validateMimeType(input.buffer, input.mimeType);
  if (!mimeCheck.valid) {
    throw new Error(
      `Invalid file type. Declared: ${input.mimeType}, detected: ${mimeCheck.detectedMime ?? "unknown"}`,
    );
  }

  const key = generateStorageKey(input.tenantId, input.entityType, input.originalFilename);
  const bucket = getBucket();

  await getStorageClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.buffer,
      ContentType: input.mimeType,
    }),
  );

  return {
    key,
    bucket,
    sizeBytes: input.buffer.length,
    mimeType: input.mimeType,
  };
}

export async function getFileDownloadUrl(
  key: string,
  requestingTenantId: string,
  expiresInSeconds: number = 3600,
): Promise<string> {
  const fileTenantId = extractTenantFromKey(key);
  if (fileTenantId !== requestingTenantId) {
    throw new Error("Access denied");
  }

  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  return getSignedUrl(getStorageClient(), command, { expiresIn: expiresInSeconds });
}

export async function deleteFile(key: string, requestingTenantId: string): Promise<void> {
  const fileTenantId = extractTenantFromKey(key);
  if (fileTenantId !== requestingTenantId) {
    throw new Error("Access denied");
  }

  await getStorageClient().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
}

export async function fileExists(key: string, requestingTenantId: string): Promise<boolean> {
  const fileTenantId = extractTenantFromKey(key);
  if (fileTenantId !== requestingTenantId) {
    throw new Error("Access denied");
  }

  try {
    await getStorageClient().send(
      new HeadObjectCommand({
        Bucket: getBucket(),
        Key: key,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
