import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseImportWorkbook } from "../excel";

/** Build an in-memory .xlsx Buffer using exceljs. */
async function buildWorkbook(
  headers: string[],
  dataRows: string[][],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");

  sheet.addRow(headers);
  for (const row of dataRows) {
    sheet.addRow(row);
  }

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

describe("parseImportWorkbook", () => {
  it("canonicalises known headers and returns data rows", async () => {
    const buffer = await buildWorkbook(
      ["ID NUMBER", "FULL NAME", "SEX", "CONTACT NUMBER"],
      [
        ["FH-001", "Dela Cruz, Juan Santos", "Male", "09171234567"],
        ["FH-002", "Reyes, Maria", "Female", "09281234567"],
      ],
    );

    const result = await parseImportWorkbook(buffer);

    expect(result.rows).toHaveLength(2);
    expect(result.headerWarnings).toHaveLength(0);

    const first = result.rows[0];
    expect(first).toBeDefined();
    expect(first!["idNumber"]).toBe("FH-001");
    expect(first!["fullName"]).toBe("Dela Cruz, Juan Santos");
    expect(first!["sex"]).toBe("Male");
    expect(first!["contactNumber"]).toBe("09171234567");
  });

  it("maps RSBSA # header to rsbsaNumber", async () => {
    const buffer = await buildWorkbook(
      ["ID NUMBER", "FULL NAME", "RSBSA #"],
      [["FH-003", "Santos, Pedro", "RSB-7890"]],
    );

    const result = await parseImportWorkbook(buffer);

    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];
    expect(row!["rsbsaNumber"]).toBe("RSB-7890");
  });

  it("emits a headerWarning for unmapped columns and keeps a slug key", async () => {
    const buffer = await buildWorkbook(
      ["ID NUMBER", "FULL NAME", "RSBSA #", "UNKNOWN COL"],
      [
        ["FH-004", "Cruz, Ana", "RSB-001", "extra data"],
        ["FH-005", "Lim, Ben", "RSB-002", "other data"],
      ],
    );

    const result = await parseImportWorkbook(buffer);

    expect(result.rows).toHaveLength(2);
    // One warning for the unmapped column.
    expect(result.headerWarnings).toHaveLength(1);
    expect(result.headerWarnings[0]).toContain("unmapped column");
    expect(result.headerWarnings[0]).toContain("UNKNOWN COL");

    // Data is still captured under the slug key.
    const first = result.rows[0];
    expect(first!["unknown_col"]).toBe("extra data");
  });

  it("skips fully-empty data rows", async () => {
    const buffer = await buildWorkbook(
      ["ID NUMBER", "FULL NAME"],
      [
        ["FH-006", "Garcia, Luis"],
        ["", ""],          // blank → must be skipped
        ["FH-007", "Torres, Ana"],
      ],
    );

    const result = await parseImportWorkbook(buffer);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]!["idNumber"]).toBe("FH-006");
    expect(result.rows[1]!["idNumber"]).toBe("FH-007");
  });

  it("returns empty rows and no warnings for a header-only workbook", async () => {
    const buffer = await buildWorkbook(
      ["ID NUMBER", "FULL NAME"],
      [], // no data rows
    );

    const result = await parseImportWorkbook(buffer);

    expect(result.rows).toHaveLength(0);
    expect(result.headerWarnings).toHaveLength(0);
  });

  it("accepts ArrayBuffer input as well as Buffer", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sheet1");
    sheet.addRow(["ID NUMBER"]);
    sheet.addRow(["FH-099"]);

    const nodeBuf = await workbook.xlsx.writeBuffer();
    // Convert to ArrayBuffer — exceljs Buffer d.ts lacks Uint8Array members;
    // cast via Uint8Array (Buffer IS a Uint8Array at runtime) to get .buffer.
    // Buffer IS a Uint8Array at runtime; cast to access TypedArray members.
    // new Uint8Array() copies data into a fresh ArrayBuffer (never SharedArrayBuffer).
    const arrayBuf: ArrayBuffer = new Uint8Array(nodeBuf as unknown as Uint8Array).buffer;

    const result = await parseImportWorkbook(arrayBuf);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!["idNumber"]).toBe("FH-099");
  });

  it("maps CATEGORIES alias to category", async () => {
    const buffer = await buildWorkbook(
      ["ID NUMBER", "CATEGORIES"],
      [["FH-010", "Fisherman"]],
    );

    const result = await parseImportWorkbook(buffer);

    expect(result.rows[0]!["category"]).toBe("Fisherman");
  });
});
