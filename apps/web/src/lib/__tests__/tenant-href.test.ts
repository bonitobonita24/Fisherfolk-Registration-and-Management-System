import { describe, expect, it } from "vitest";

import { computeTenantPrefix, joinTenantPath } from "../tenant-href";

describe("computeTenantPrefix", () => {
  // SAFETY INVARIANT: on a subdirectory host the prefix is byte-identical to
  // the historical `/${slug}` — prod behaviour must never change.
  describe("subdirectory host (prod — visible path includes slug)", () => {
    it("returns /slug when the visible path is the bare tenant root", () => {
      expect(computeTenantPrefix("demo", "/demo")).toBe("/demo");
    });
    it("returns /slug when the visible path is under the tenant subtree", () => {
      expect(computeTenantPrefix("demo", "/demo/dashboard")).toBe("/demo");
      expect(computeTenantPrefix("calapan-city", "/calapan-city/fisherfolk")).toBe(
        "/calapan-city",
      );
      expect(
        computeTenantPrefix("calapan-city", "/calapan-city/fisherfolk/abc123"),
      ).toBe("/calapan-city");
    });
  });

  describe("masked custom-domain host (visible path is clean)", () => {
    it("returns empty prefix so links stay clean and avoid the 308", () => {
      expect(computeTenantPrefix("demo", "/dashboard")).toBe("");
      expect(computeTenantPrefix("demo", "/fisherfolk")).toBe("");
      expect(computeTenantPrefix("demo", "/")).toBe("");
    });
    it("does not false-positive on a clean path that merely shares a prefix", () => {
      // "/demonstrations" must NOT be read as the "demo" subtree.
      expect(computeTenantPrefix("demo", "/demonstrations")).toBe("");
    });
  });

  it("returns empty prefix when slug is missing", () => {
    expect(computeTenantPrefix("", "/anything")).toBe("");
  });
});

describe("joinTenantPath", () => {
  it("joins a slug prefix with an app-relative path", () => {
    expect(joinTenantPath("/demo", "/fisherfolk")).toBe("/demo/fisherfolk");
    expect(joinTenantPath("/demo", "fisherfolk")).toBe("/demo/fisherfolk");
  });
  it("returns a clean path when prefix is empty (masked host)", () => {
    expect(joinTenantPath("", "/fisherfolk")).toBe("/fisherfolk");
    expect(joinTenantPath("", "fisherfolk")).toBe("/fisherfolk");
  });
  it("preserves nested paths and query/hash suffixes verbatim", () => {
    expect(joinTenantPath("/demo", "/fisherfolk/abc123")).toBe(
      "/demo/fisherfolk/abc123",
    );
    expect(joinTenantPath("", "/fisherfolk?page=2")).toBe("/fisherfolk?page=2");
  });
});
