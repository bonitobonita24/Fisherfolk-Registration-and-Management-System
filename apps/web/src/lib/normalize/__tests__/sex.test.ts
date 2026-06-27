import { describe, it, expect } from "vitest";
import { normalizeSex } from "../sex";

describe("normalizeSex", () => {
  // ── Male variants ──────────────────────────────────────────────────────────

  it('"m" resolves to Male', () => {
    expect(normalizeSex("m")).toEqual({ value: "Male" });
  });

  it('"M" resolves to Male', () => {
    expect(normalizeSex("M")).toEqual({ value: "Male" });
  });

  it('"male" resolves to Male', () => {
    expect(normalizeSex("male")).toEqual({ value: "Male" });
  });

  it('"MALE" resolves to Male (first-char check)', () => {
    expect(normalizeSex("MALE")).toEqual({ value: "Male" });
  });

  // ── Female variants ────────────────────────────────────────────────────────

  it('"f" resolves to Female', () => {
    expect(normalizeSex("f")).toEqual({ value: "Female" });
  });

  it('"F" resolves to Female', () => {
    expect(normalizeSex("F")).toEqual({ value: "Female" });
  });

  it('"Female" resolves to Female', () => {
    expect(normalizeSex("Female")).toEqual({ value: "Female" });
  });

  it('"female" resolves to Female', () => {
    expect(normalizeSex("female")).toEqual({ value: "Female" });
  });

  // ── Unrecognized / null cases ──────────────────────────────────────────────

  it('"x" returns null + warning', () => {
    const result = normalizeSex("x");
    expect(result.value).toBeNull();
    expect(result.warning).toBeTruthy();
  });

  it('"other" returns null + warning', () => {
    const result = normalizeSex("other");
    expect(result.value).toBeNull();
    expect(result.warning).toBeTruthy();
  });

  it("empty string returns null + warning", () => {
    const result = normalizeSex("");
    expect(result.value).toBeNull();
    expect(result.warning).toMatch(/empty sex field/i);
  });

  it("whitespace-only string returns null + warning", () => {
    const result = normalizeSex("   ");
    expect(result.value).toBeNull();
    expect(result.warning).toBeTruthy();
  });
});
