import { describe, it, expect } from "vitest";
import { normalizeDob } from "../dob";

describe("normalizeDob", () => {
  // ── Canonical formats ──────────────────────────────────────────────────────

  it("parses MM/DD/YYYY to YYYY-MM-DD", () => {
    expect(normalizeDob("03/15/1990")).toEqual({ value: "1990-03-15" });
  });

  it("parses single-digit M/D/YYYY to YYYY-MM-DD", () => {
    expect(normalizeDob("3/5/1990")).toEqual({ value: "1990-03-05" });
  });

  it("passes through already-ISO YYYY-MM-DD unchanged", () => {
    expect(normalizeDob("1990-03-15")).toEqual({ value: "1990-03-15" });
  });

  it("passes through ISO with single-digit month/day", () => {
    expect(normalizeDob("1990-3-5")).toEqual({ value: "1990-03-05" });
  });

  // ── 2-digit year expansion ─────────────────────────────────────────────────

  it("M/D/YY with yy > 30 expands to 19yy", () => {
    // yy = 90 → 1990
    expect(normalizeDob("3/15/90")).toEqual({ value: "1990-03-15" });
  });

  it("M/D/YY with yy = 31 (boundary) expands to 1931", () => {
    expect(normalizeDob("1/1/31")).toEqual({ value: "1931-01-01" });
  });

  it("M/D/YY with yy <= 30 expands to 20yy", () => {
    // yy = 25 → 2025
    expect(normalizeDob("3/15/25")).toEqual({ value: "2025-03-15" });
  });

  it("M/D/YY with yy = 30 (boundary) expands to 2030", () => {
    expect(normalizeDob("6/1/30")).toEqual({ value: "2030-06-01" });
  });

  // ── Malformed / unrecoverable ──────────────────────────────────────────────

  it("3-digit year pattern returns null + warning", () => {
    const result = normalizeDob("990-11-19");
    expect(result.value).toBeNull();
    expect(result.warning).toBeTruthy();
    expect(result.warning).toMatch(/3-digit year/i);
  });

  it("empty string returns null + warning", () => {
    const result = normalizeDob("");
    expect(result.value).toBeNull();
    expect(result.warning).toBeTruthy();
  });

  it("whitespace-only string returns null + warning", () => {
    const result = normalizeDob("   ");
    expect(result.value).toBeNull();
    expect(result.warning).toBeTruthy();
  });

  it("completely unparseable string returns null + warning", () => {
    const result = normalizeDob("not-a-date");
    expect(result.value).toBeNull();
    expect(result.warning).toBeTruthy();
  });

  it("invalid month (13) in ISO format returns null + warning", () => {
    const result = normalizeDob("1990-13-01");
    expect(result.value).toBeNull();
    expect(result.warning).toBeTruthy();
  });

  // ── Leap year handling ─────────────────────────────────────────────────────

  it("Feb 29 on a leap year is accepted", () => {
    // 2000 is a leap year
    expect(normalizeDob("2/29/2000")).toEqual({ value: "2000-02-29" });
  });

  it("Feb 29 on a non-leap year returns null + warning", () => {
    // 2001 is not a leap year
    const result = normalizeDob("2/29/2001");
    expect(result.value).toBeNull();
    expect(result.warning).toBeTruthy();
  });

  it("Feb 28 on a non-leap year is accepted", () => {
    expect(normalizeDob("2/28/2001")).toEqual({ value: "2001-02-28" });
  });
});
