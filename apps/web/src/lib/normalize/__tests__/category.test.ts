import { describe, it, expect } from "vitest";
import { mapCategory } from "../category";

describe("mapCategory", () => {
  // ── Single category keywords ───────────────────────────────────────────────

  it('"Boat Owner" maps to ["Boat Owner/Operator"]', () => {
    expect(mapCategory("Boat Owner")).toEqual({
      value: ["Boat Owner/Operator"],
    });
  });

  it('"capture fishing" (lowercase) maps to ["Capture Fishing"]', () => {
    expect(mapCategory("capture fishing")).toEqual({
      value: ["Capture Fishing"],
    });
  });

  it('"gleaner" maps to ["Gleaning"]', () => {
    expect(mapCategory("gleaner")).toEqual({ value: ["Gleaning"] });
  });

  it('"gleaning" also maps to ["Gleaning"]', () => {
    expect(mapCategory("gleaning")).toEqual({ value: ["Gleaning"] });
  });

  it('"Vendor" maps to ["Vendor"]', () => {
    expect(mapCategory("Vendor")).toEqual({ value: ["Vendor"] });
  });

  it('"Fish Processing" maps to ["Fish Processing"]', () => {
    expect(mapCategory("Fish Processing")).toEqual({
      value: ["Fish Processing"],
    });
  });

  it('"Aquaculture" maps to ["Aquaculture"]', () => {
    expect(mapCategory("Aquaculture")).toEqual({ value: ["Aquaculture"] });
  });

  // ── Multiple categories (comma-separated) ─────────────────────────────────

  it('"capture fishing, vendor" returns both categories in order', () => {
    expect(mapCategory("capture fishing, vendor")).toEqual({
      value: ["Capture Fishing", "Vendor"],
    });
  });

  it('"Boat Owner, Gleaner" returns both', () => {
    expect(mapCategory("Boat Owner, Gleaner")).toEqual({
      value: ["Boat Owner/Operator", "Gleaning"],
    });
  });

  it("semicolon delimiter is also supported", () => {
    expect(mapCategory("vendor; aquaculture")).toEqual({
      value: ["Vendor", "Aquaculture"],
    });
  });

  it("slash delimiter is also supported", () => {
    expect(mapCategory("gleaner/vendor")).toEqual({
      value: ["Gleaning", "Vendor"],
    });
  });

  // ── Deduplication ─────────────────────────────────────────────────────────

  it('"vendor, vending" deduplicates to ["Vendor"]', () => {
    // both "vendor" and "vending" contain keyword "vend"
    expect(mapCategory("vendor, vending")).toEqual({ value: ["Vendor"] });
  });

  it('"gleaner, gleaning" deduplicates to ["Gleaning"]', () => {
    expect(mapCategory("gleaner, gleaning")).toEqual({ value: ["Gleaning"] });
  });

  // ── Unknown / no match ────────────────────────────────────────────────────

  it("unknown category string returns empty array + warning", () => {
    const result = mapCategory("xyz unknown category");
    expect(result.value).toEqual([]);
    expect(result.warning).toBeTruthy();
    expect(result.warning).toMatch(/no category matched/i);
  });

  it("empty string returns empty array + warning", () => {
    const result = mapCategory("");
    expect(result.value).toEqual([]);
    expect(result.warning).toBeTruthy();
  });

  // ── Case-insensitive matching ──────────────────────────────────────────────

  it('"BOAT OWNER" (all-caps) matches correctly', () => {
    expect(mapCategory("BOAT OWNER")).toEqual({
      value: ["Boat Owner/Operator"],
    });
  });

  it("mixed-case input works", () => {
    expect(mapCategory("Capture Fishing")).toEqual({
      value: ["Capture Fishing"],
    });
  });
});
