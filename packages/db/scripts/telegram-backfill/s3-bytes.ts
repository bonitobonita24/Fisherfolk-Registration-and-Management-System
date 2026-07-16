/**
 * s3-bytes.ts
 *
 * Small helper to fetch an S3/MinIO object's full body into a Buffer.
 * `GetObjectCommand`'s `Body` is a Node.js `Readable` (in the Node runtime),
 * a web `ReadableStream`, or a `Blob` depending on the SDK's request
 * handler — this helper normalizes all three to a `Buffer` without pulling
 * in the `@aws-sdk/util-stream` package.
 */

import type { S3Client } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

interface NodeReadableLike {
  [Symbol.asyncIterator](): AsyncIterator<Uint8Array>;
}

function isNodeReadable(body: unknown): body is NodeReadableLike {
  return (
    body !== null &&
    typeof body === "object" &&
    typeof (body as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === "function"
  );
}

function hasArrayBuffer(body: unknown): body is { transformToByteArray(): Promise<Uint8Array> } {
  return (
    body !== null &&
    typeof body === "object" &&
    typeof (body as { transformToByteArray?: unknown }).transformToByteArray === "function"
  );
}

export async function getObjectBytes(
  s3: S3Client,
  bucket: string,
  key: string,
  abortSignal?: AbortSignal,
): Promise<Buffer> {
  // Passing an AbortSignal into the SDK request lets a per-item timeout
  // actually tear down a hung socket (rather than merely losing the race and
  // leaking the connection). The @smithy AbortSignal shape is structurally
  // compatible with the global AbortSignal returned by AbortSignal.timeout().
  const res = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    abortSignal !== undefined ? { abortSignal } : {},
  );
  const body: unknown = res.Body;

  if (body === undefined) {
    throw new Error(`GetObjectCommand for key "${key}" returned no Body`);
  }

  // AWS SDK v3 "mixin" body helper (works for web streams + Blob in
  // browser/edge request handlers).
  if (hasArrayBuffer(body)) {
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }

  // Node.js Readable stream (the common case under the default Node HTTP
  // request handler).
  if (isNodeReadable(body)) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  throw new Error(`GetObjectCommand for key "${key}" returned an unsupported Body type`);
}
