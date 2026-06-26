import { describe, it, expect } from "vitest";
import { normalizeContact } from "../contact";

describe("normalizeContact", () => {
  // ── Already canonical ──────────────────────────────────────────────────────

  it("11-digit 09xxxxxxxx string passes through unchanged", () => {
    expect(normalizeContact("09171234567")).toEqual({ value: "09171234567" });
  });

  // ── 10-digit (local, missing leading 0) ───────────────────────────────────

  it("10-digit string starting with 9 gets leading 0 prepended", () => {
    expect(normalizeContact("9171234567")).toEqual({ value: "09171234567" });
  });

  // ── +63 international prefix ──────────────────────────────────────────────

  it("+639xxxxxxxxx converts to 09xxxxxxxxx", () => {
    expect(normalizeContact("+639171234567")).toEqual({ value: "09171234567" });
  });

  it("639xxxxxxxxx (no plus) converts to 09xxxxxxxxx", () => {
    expect(normalizeContact("639171234567")).toEqual({ value: "09171234567" });
  });

  // ── Formatting noise stripped ──────────────────────────────────────────────

  it("hyphen-formatted 0917-123-4567 normalizes to 09171234567", () => {
    expect(normalizeContact("0917-123-4567")).toEqual({ value: "09171234567" });
  });

  it("space-formatted 0917 123 4567 normalizes to 09171234567", () => {
    expect(normalizeContact("0917 123 4567")).toEqual({ value: "09171234567" });
  });

  it("parenthesis-formatted (0917) 123 4567 normalizes to 09171234567", () => {
    expect(normalizeContact("(0917) 123 4567")).toEqual({
      value: "09171234567",
    });
  });

  // ── Non-conforming — store-but-flag ───────────────────────────────────────

  it("garbage short number is stored with a warning", () => {
    const result = normalizeContact("123");
    expect(result.value).toBe("123");
    expect(result.warning).toBeTruthy();
    expect(result.warning).toMatch(/non-conforming/i);
  });

  it("11-digit number NOT starting with 09 is stored with a warning", () => {
    // e.g. starts with 08 — not a valid PH mobile prefix
    const result = normalizeContact("08171234567");
    expect(result.value).toBe("08171234567");
    expect(result.warning).toBeTruthy();
  });

  // ── Empty ─────────────────────────────────────────────────────────────────

  it("empty string returns null with no warning", () => {
    const result = normalizeContact("");
    expect(result.value).toBeNull();
    expect(result.warning).toBeUndefined();
  });

  it("whitespace-only string returns null with no warning", () => {
    const result = normalizeContact("   ");
    expect(result.value).toBeNull();
    expect(result.warning).toBeUndefined();
  });
});
