/**
 * Unit tests — s3-bytes.ts getObjectBytes().
 */

import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import type { S3Client } from "@aws-sdk/client-s3";

import { getObjectBytes } from "../s3-bytes";

function fakeClient(send: (cmd: unknown) => Promise<unknown>): S3Client {
  return { send } as unknown as S3Client;
}

describe("getObjectBytes", () => {
  it("buffers a Node.js Readable Body", async () => {
    const body = Readable.from([Buffer.from("hello "), Buffer.from("world")]);
    const s3 = fakeClient(() => Promise.resolve({ Body: body }));

    const result = await getObjectBytes(s3, "bucket", "tenant/entity/key.jpg");
    expect(result.toString("utf-8")).toBe("hello world");
  });

  it("uses transformToByteArray() when the Body exposes the SDK mixin helper", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const body = { transformToByteArray: () => Promise.resolve(bytes) };
    const s3 = fakeClient(() => Promise.resolve({ Body: body }));

    const result = await getObjectBytes(s3, "bucket", "tenant/entity/key.jpg");
    expect(Array.from(result)).toEqual([1, 2, 3]);
  });

  it("throws when the response has no Body", async () => {
    const s3 = fakeClient(() => Promise.resolve({}));
    await expect(getObjectBytes(s3, "bucket", "key")).rejects.toThrow(/no Body/);
  });

  it("throws on an unsupported Body type", async () => {
    const s3 = fakeClient(() => Promise.resolve({ Body: 42 }));
    await expect(getObjectBytes(s3, "bucket", "key")).rejects.toThrow(/unsupported Body type/);
  });
});
