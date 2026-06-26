import { describe, it, expect } from "vitest";
import { normalizeBarangay } from "../barangay";

describe("normalizeBarangay", () => {
  // ── Basic extraction + title casing ───────────────────────────────────────

  it("takes text before the first comma", () => {
    expect(normalizeBarangay("Poblacion, Calapan City")).toEqual({
      value: "Poblacion",
    });
  });

  it("title-cases a plain barangay name", () => {
    expect(normalizeBarangay("santo nino, calapan")).toEqual({
      value: "Santo Nino",
    });
  });

  // ── Trailing arabic digit → Roman numeral ─────────────────────────────────

  it("converts trailing arabic digit 1 to Roman numeral I", () => {
    expect(normalizeBarangay("Nag-Iba 1, Calapan")).toEqual({
      value: "Nag-Iba I",
    });
  });

  it("converts trailing arabic digit 2 to Roman numeral II", () => {
    expect(normalizeBarangay("Communal 2, Calapan")).toEqual({
      value: "Communal II",
    });
  });

  it("does NOT convert a mid-token arabic digit to Roman", () => {
    // "2" is NOT the last token here
    const result = normalizeBarangay("2 Communal, Calapan");
    // "2" in position 0 (not last) — stays "2"
    expect(result.value).toBe("2 Communal");
  });

  // ── Roman numeral words → uppercase ───────────────────────────────────────

  it('lowercase roman numeral word "ii" uppercased to "II"', () => {
    expect(normalizeBarangay("comunal ii, calapan")).toEqual({
      value: "Comunal II",
    });
  });

  it("mixed-case roman numeral word uppercased", () => {
    expect(normalizeBarangay("barangay Iii, calapan")).toEqual({
      value: "Barangay III",
    });
  });

  // ── Hyphenated names ───────────────────────────────────────────────────────

  it("title-cases each segment of a hyphenated barangay name", () => {
    expect(normalizeBarangay("nag-iba, calapan")).toEqual({
      value: "Nag-Iba",
    });
  });

  // ── typoMap ───────────────────────────────────────────────────────────────

  it("applies typoMap correction (exact key match)", () => {
    expect(
      normalizeBarangay("Comunal, Calapan", {
        typoMap: { Comunal: "Communal" },
      })
    ).toEqual({ value: "Communal" });
  });

  it("applies typoMap case-insensitively (key in different case)", () => {
    // Input normalized to "Comunal"; map key is "COMUNAL"
    expect(
      normalizeBarangay("comunal, calapan", {
        typoMap: { COMUNAL: "Communal" },
      })
    ).toEqual({ value: "Communal" });
  });

  it("typoMap does not match partial names", () => {
    // "Comunal II" should NOT match a typoMap key "Comunal"
    const result = normalizeBarangay("comunal ii, calapan", {
      typoMap: { Comunal: "Communal" },
    });
    expect(result.value).toBe("Comunal II");
    expect(result.warning).toBeUndefined();
  });

  // ── validList ─────────────────────────────────────────────────────────────

  it("returns value without warning when barangay is in validList", () => {
    const result = normalizeBarangay("Nag-Iba 1, Calapan", {
      validList: ["Nag-Iba I", "Comunal"],
    });
    expect(result.value).toBe("Nag-Iba I");
    expect(result.warning).toBeUndefined();
  });

  it("returns value WITH warning when barangay is not in validList", () => {
    const result = normalizeBarangay("Unknown Brgy, Calapan", {
      validList: ["Nag-Iba I"],
    });
    expect(result.value).toBe("Unknown Brgy");
    expect(result.warning).toMatch(/not in tenant list/i);
  });

  it("validList check is case-insensitive", () => {
    const result = normalizeBarangay("Poblacion, Calapan", {
      validList: ["poblacion"],
    });
    expect(result.value).toBe("Poblacion");
    expect(result.warning).toBeUndefined();
  });

  // ── Empty / null ──────────────────────────────────────────────────────────

  it("empty string returns null + warning", () => {
    const result = normalizeBarangay("");
    expect(result.value).toBeNull();
    expect(result.warning).toBeTruthy();
  });

  it("string with only a comma returns null + warning", () => {
    const result = normalizeBarangay(", Calapan");
    expect(result.value).toBeNull();
    expect(result.warning).toBeTruthy();
  });
});
