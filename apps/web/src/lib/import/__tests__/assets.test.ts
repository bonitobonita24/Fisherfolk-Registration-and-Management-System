import { describe, it, expect } from "vitest";
import {
  assetKeyFromFilename,
  matchAssets,
  buildMissingAssetsCsv,
} from "../assets";

// ---------------------------------------------------------------------------
// assetKeyFromFilename
// ---------------------------------------------------------------------------

describe("assetKeyFromFilename", () => {
  it("strips extension and lowercases — real FMO filename", () => {
    expect(assetKeyFromFilename("MR-CL-002660-2015.JPG")).toBe(
      "mr-cl-002660-2015",
    );
  });

  it("handles lowercase extension", () => {
    expect(assetKeyFromFilename("MR-CL-002660-2015.png")).toBe(
      "mr-cl-002660-2015",
    );
  });

  it("trims surrounding whitespace before lowercasing", () => {
    expect(assetKeyFromFilename("  MR-CL-002660-2015.PNG  ")).toBe(
      "mr-cl-002660-2015",
    );
  });

  it("handles filenames without extension", () => {
    expect(assetKeyFromFilename("NOID")).toBe("noid");
  });

  it("strips path prefix (last segment only)", () => {
    expect(assetKeyFromFilename("photos/2015/MR-CL-002660-2015.JPG")).toBe(
      "mr-cl-002660-2015",
    );
  });
});

// ---------------------------------------------------------------------------
// matchAssets
// ---------------------------------------------------------------------------

describe("matchAssets", () => {
  it("matches case-insensitively (upper idNumber, upper filename)", () => {
    const result = matchAssets(
      ["MR-CL-002660-2015"],
      ["MR-CL-002660-2015.JPG"],
    );
    expect(result.matched.get("MR-CL-002660-2015")).toBe(
      "MR-CL-002660-2015.JPG",
    );
    expect(result.missing).toHaveLength(0);
    expect(result.orphans).toHaveLength(0);
  });

  it("matches when idNumber is uppercase and filename is lowercase", () => {
    const result = matchAssets(["MR-CL-002660-2015"], ["mr-cl-002660-2015.jpg"]);
    expect(result.matched.get("MR-CL-002660-2015")).toBe("mr-cl-002660-2015.jpg");
  });

  it("reports idNumber as missing when no file exists", () => {
    const result = matchAssets(["NO-MATCH-001"], ["OTHER-FILE.JPG"]);
    expect(result.matched.size).toBe(0);
    expect(result.missing).toContain("NO-MATCH-001");
    expect(result.orphans).toContain("OTHER-FILE.JPG");
  });

  it("reports file as orphan when no idNumber exists", () => {
    const result = matchAssets(["ID-001"], ["ID-001.JPG", "EXTRA-FILE.PNG"]);
    expect(result.orphans).toContain("EXTRA-FILE.PNG");
    expect(result.orphans).not.toContain("ID-001.JPG");
  });

  it("handles mixed counts — 2 matched, 1 missing, 1 orphan", () => {
    const result = matchAssets(
      ["ID-001", "ID-002", "ID-003"],
      ["ID-001.jpg", "ID-002.JPG", "ORPHAN.png"],
    );
    expect(result.matched.size).toBe(2);
    expect(result.missing).toEqual(["ID-003"]);
    expect(result.orphans).toEqual(["ORPHAN.png"]);
  });

  it("preserves input order for missing", () => {
    const result = matchAssets(["B", "A", "C"], ["X.jpg"]);
    expect(result.missing).toEqual(["B", "A", "C"]);
  });

  it("preserves input order for orphans", () => {
    const result = matchAssets(["ID-001"], ["ALPHA.png", "BETA.jpg"]);
    expect(result.orphans).toEqual(["ALPHA.png", "BETA.jpg"]);
  });

  it("returns empty collections for empty inputs", () => {
    const result = matchAssets([], []);
    expect(result.matched.size).toBe(0);
    expect(result.missing).toHaveLength(0);
    expect(result.orphans).toHaveLength(0);
  });

  it("original case preserved in matched map keys and values", () => {
    const result = matchAssets(
      ["PD-Cl-001"],
      ["pd-CL-001.PNG"],
    );
    // key = "PD-Cl-001" (original idNumber), value = "pd-CL-001.PNG" (original filename)
    expect(result.matched.has("PD-Cl-001")).toBe(true);
    expect(result.matched.get("PD-Cl-001")).toBe("pd-CL-001.PNG");
  });
});

// ---------------------------------------------------------------------------
// buildMissingAssetsCsv
// ---------------------------------------------------------------------------

describe("buildMissingAssetsCsv", () => {
  it("returns only the header row for empty input", () => {
    expect(buildMissingAssetsCsv([])).toBe("id_number,full_name,address,missing");
  });

  it("produces correct columns for a full row", () => {
    const csv = buildMissingAssetsCsv([
      {
        idNumber: "ID-001",
        fullName: "Juan",
        address: "Manila",
        missing: "both",
      },
    ]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("ID-001,Juan,Manila,both");
  });

  it("quotes a full_name that contains a comma — RFC 4180", () => {
    const csv = buildMissingAssetsCsv([
      {
        idNumber: "ID-001",
        fullName: "Dela Cruz, Juan",
        missing: "photo",
      },
    ]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe('ID-001,"Dela Cruz, Juan",,photo');
  });

  it("omits optional fields as empty columns when not provided", () => {
    const csv = buildMissingAssetsCsv([
      { idNumber: "ID-002", missing: "signature" },
    ]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("ID-002,,,signature");
  });

  it("escapes double-quotes inside a field by doubling them", () => {
    const csv = buildMissingAssetsCsv([
      {
        idNumber: 'ID-"X"',
        missing: "photo",
      },
    ]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe('"ID-""X""",,,"photo"'.replace('"photo"', "photo"));
    // Cleaner assertion: the id_number column is properly quoted
    expect(lines[1]).toContain('"ID-""X"""');
  });

  it("produces two data rows for two input records", () => {
    const csv = buildMissingAssetsCsv([
      { idNumber: "A", missing: "photo" },
      { idNumber: "B", missing: "signature" },
    ]);
    expect(csv.split("\n")).toHaveLength(3); // header + 2 rows
  });
});
