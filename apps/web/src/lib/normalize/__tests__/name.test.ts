import { describe, expect, it } from "vitest";
import { parseFullName } from "../name";

describe("parseFullName", () => {
  it("parses comma form with middle name", () => {
    const result = parseFullName("Dela Cruz, Juan Santos");
    expect(result.lastName).toBe("Dela Cruz");
    expect(result.firstName).toBe("Juan");
    expect(result.middleName).toBe("Santos");
    expect(result.fullName).toBe("Dela Cruz, Juan Santos");
  });

  it("parses comma form — uppercased input is title-cased", () => {
    const result = parseFullName("DELA CRUZ, JUAN SANTOS");
    expect(result.lastName).toBe("Dela Cruz");
    expect(result.firstName).toBe("Juan");
    expect(result.middleName).toBe("Santos");
  });

  it("parses comma form with no middle name (middleName = null)", () => {
    const result = parseFullName("Reyes, Maria");
    expect(result.lastName).toBe("Reyes");
    expect(result.firstName).toBe("Maria");
    expect(result.middleName).toBeNull();
  });

  it("parses no-comma 3-token form", () => {
    const result = parseFullName("Juan Santos Cruz");
    expect(result.firstName).toBe("Juan");
    expect(result.middleName).toBe("Santos");
    expect(result.lastName).toBe("Cruz");
    expect(result.fullName).toBe("Juan Santos Cruz");
  });

  it("parses no-comma 2-token form", () => {
    const result = parseFullName("Maria Santos");
    expect(result.firstName).toBe("Maria");
    expect(result.lastName).toBe("Santos");
    expect(result.middleName).toBeNull();
  });

  it("parses no-comma 1-token form", () => {
    const result = parseFullName("Pedro");
    expect(result.firstName).toBe("Pedro");
    expect(result.lastName).toBe("");
    expect(result.middleName).toBeNull();
  });

  it("returns empty strings and null for empty input", () => {
    const result = parseFullName("");
    expect(result.firstName).toBe("");
    expect(result.lastName).toBe("");
    expect(result.middleName).toBeNull();
    expect(result.fullName).toBe("");
  });

  it("collapses extra whitespace and reflects in fullName", () => {
    const result = parseFullName("  DELA CRUZ ,  JUAN   SANTOS  ");
    expect(result.lastName).toBe("Dela Cruz");
    expect(result.firstName).toBe("Juan");
    expect(result.middleName).toBe("Santos");
    // fullName is the whitespace-collapsed version
    expect(result.fullName).toBe("DELA CRUZ , JUAN SANTOS");
  });

  it("title-cases hyphenated last names correctly", () => {
    const result = parseFullName("DELA-CRUZ, JOSE");
    expect(result.lastName).toBe("Dela-Cruz");
    expect(result.firstName).toBe("Jose");
    expect(result.middleName).toBeNull();
  });
});
