/**
 * Unit tests — manifest.ts (load/save round-trip).
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadManifest, saveManifest, type Manifest } from "../manifest";

describe("manifest.ts", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "frms-backfill-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("saves and loads a manifest round-trip", () => {
    const manifest: Manifest = {
      createdAt: "2026-07-14T00:00:00.000Z",
      sourceTenantId: "tenant-1",
      chatId: "-1000000000",
      entries: [
        {
          idNumber: "MR-CL-002178-2015",
          recordId: "ff-1",
          entityType: "fisherfolk-photo",
          sourceStorageKey: "tenant-1/fisherfolk-photo/abc.jpg",
          telegramFileId: "file-1",
          telegramMessageId: "101",
          sizeBytes: 12345,
          mimeType: "image/jpeg",
          ext: ".jpg",
        },
      ],
    };

    const path = join(dir, "manifest.json");
    saveManifest(path, manifest);
    const loaded = loadManifest(path);

    expect(loaded).toEqual(manifest);
  });

  it("throws on a malformed manifest (missing entries array)", () => {
    const path = join(dir, "bad.json");
    saveManifest(path, { foo: "bar" } as unknown as Manifest);
    expect(() => loadManifest(path)).toThrow(/malformed/);
  });
});
