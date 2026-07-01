import { describe, expect, it } from "vitest";

import {
  idElementSchema,
  ID_CARD_GEOMETRY,
  TEMPLATE_VARIABLES,
  templateVariableKeySchema,
} from "@frms/shared/schemas";

// Minimal valid base fields shared by all element types
const base = {
  id: "el-001",
  xMm: 10,
  yMm: 5,
  widthMm: 30,
  heightMm: 8,
  zIndex: 1,
};

const typography = {
  fontFamily: "Inter",
  fontSizePt: 10,
  fontWeight: 400 as const,
  color: "#1A2B3C",
  align: "left" as const,
};

describe("idElementSchema — valid elements", () => {
  it("accepts a text element", () => {
    const result = idElementSchema.safeParse({
      ...base,
      type: "text",
      content: "Hello World",
      ...typography,
    });
    expect(result.success).toBe(true);
  });

  it("applies default rotation=0 when omitted", () => {
    const result = idElementSchema.safeParse({
      ...base,
      type: "text",
      content: "Test",
      ...typography,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rotation).toBe(0);
  });

  it("accepts a variable element with a valid catalog key", () => {
    const result = idElementSchema.safeParse({
      ...base,
      type: "variable",
      variableKey: "{{full_name}}",
      ...typography,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an image element", () => {
    const result = idElementSchema.safeParse({
      ...base,
      type: "image",
      url: "https://cdn.example.com/seal.png",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an icon element with emoji", () => {
    const result = idElementSchema.safeParse({
      ...base,
      type: "icon",
      emoji: "🐟",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a photo placeholder element", () => {
    const result = idElementSchema.safeParse({ ...base, type: "photo" });
    expect(result.success).toBe(true);
  });

  it("accepts a signature placeholder element", () => {
    const result = idElementSchema.safeParse({ ...base, type: "signature" });
    expect(result.success).toBe(true);
  });

  it("accepts a qr placeholder element", () => {
    const result = idElementSchema.safeParse({ ...base, type: "qr" });
    expect(result.success).toBe(true);
  });
});

describe("idElementSchema — rejection cases", () => {
  it("rejects an unknown type", () => {
    const result = idElementSchema.safeParse({
      ...base,
      type: "barcode",
      content: "x",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a text element missing widthMm", () => {
    const { widthMm: _w, ...baseNoWidth } = base;
    const result = idElementSchema.safeParse({
      ...baseNoWidth,
      type: "text",
      content: "Hi",
      ...typography,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a text element with a bad hex color", () => {
    const result = idElementSchema.safeParse({
      ...base,
      type: "text",
      content: "Hi",
      ...typography,
      color: "red", // not a 6-digit hex
    });
    expect(result.success).toBe(false);
  });

  it("rejects a variable element with an unknown variableKey", () => {
    const result = idElementSchema.safeParse({
      ...base,
      type: "variable",
      variableKey: "{{unknown_field}}",
      ...typography,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an image element with a non-URL string", () => {
    const result = idElementSchema.safeParse({
      ...base,
      type: "image",
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an element missing the type field entirely", () => {
    const result = idElementSchema.safeParse({ ...base });
    expect(result.success).toBe(false);
  });
});

describe("ID_CARD_GEOMETRY constants", () => {
  it("has correct content dimensions", () => {
    // Reverted to standard CR80: 86×54mm cut / 88×56mm bleed — see DECISIONS_LOG.md (commit 12dbdd1)
    expect(ID_CARD_GEOMETRY.contentWidthMm).toBe(86);
    expect(ID_CARD_GEOMETRY.contentHeightMm).toBe(54);
  });

  it("bleed = content + 2×margin", () => {
    expect(ID_CARD_GEOMETRY.bleedWidthMm).toBe(
      ID_CARD_GEOMETRY.contentWidthMm + 2 * ID_CARD_GEOMETRY.bleedMarginMm,
    );
    expect(ID_CARD_GEOMETRY.bleedHeightMm).toBe(
      ID_CARD_GEOMETRY.contentHeightMm + 2 * ID_CARD_GEOMETRY.bleedMarginMm,
    );
  });
});

describe("TEMPLATE_VARIABLES catalog", () => {
  it("contains all required FISHERFOLK variables", () => {
    const fishKeys = TEMPLATE_VARIABLES
      .filter((v) => v.group === "FISHERFOLK")
      .map((v) => v.key);
    const required = [
      "{{photo}}",
      "{{signature}}",
      "{{qr_code}}",
      "{{registration_number}}",
      "{{full_name}}",
      "{{date_of_birth}}",
      "{{rsbsa_number}}",
    ];
    for (const k of required) expect(fishKeys).toContain(k);
  });

  it("all variable keys pass templateVariableKeySchema", () => {
    for (const v of TEMPLATE_VARIABLES) {
      expect(templateVariableKeySchema.safeParse(v.key).success).toBe(true);
    }
  });

  it("contains VESSEL and SHARED groups", () => {
    const groups = new Set(TEMPLATE_VARIABLES.map((v) => v.group));
    expect(groups.has("VESSEL")).toBe(true);
    expect(groups.has("SHARED")).toBe(true);
  });
});
