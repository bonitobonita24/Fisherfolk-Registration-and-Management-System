/**
 * report.ts — tRPC router for FRMS Reports.
 * 9 report types with optional filters; Excel export for Admin/Super Admin.
 *
 * TypeScript strict + exactOptionalPropertyTypes.
 * All queries are tenant-scoped (L6 guard).
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import ExcelJS from "exceljs";
import type { Prisma } from "@frms/db";

import { adminProcedure, createTRPCRouter, protectedProcedure } from "../trpc";
import type { TRPCContext } from "../context";
import { domainReportProcedures } from "./report/domain-procedures";

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const filtersSchema = z.object({
  barangay: z.string().optional(),
  categoryId: z.string().optional(),
  year: z.number().int().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

type Filters = z.infer<typeof filtersSchema>;

const reportTypeSchema = z.enum([
  "member_list",
  "new_registrations",
  "renewed",
  "inactive",
  "senior_citizens",
  "voter_eligible",
  "violations",
  "vessels",
  "family_clusters",
  "households",
]);

type ReportType = z.infer<typeof reportTypeSchema>;

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

type Column = { key: string; label: string };
type Row = Record<string, string | number>;

export type ReportResult = {
  title: string;
  columns: Column[];
  rows: Row[];
  generatedAt: string;
  count: number;
};

// Minimal ctx shape passed to the shared helper — avoids importing the full
// context while keeping TypeScript happy.
type ReportCtx = {
  db: TRPCContext["db"];
  tenantId: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_TITLES: Record<ReportType, string> = {
  member_list: "Masterlist of Fisherfolk Members",
  new_registrations: "New Registrations",
  renewed: "Renewed Registrations",
  inactive: "Inactive Members",
  senior_citizens: "Senior Citizen Members (60+)",
  voter_eligible: "Voter-Eligible Members (18+)",
  violations: "Violations Report",
  vessels: "Registered Vessels",
  family_clusters: "Family Clusters",
  households: "Household Masterlist",
};

const FISHERFOLK_COLS: Column[] = [
  { key: "idNumber", label: "ID Number" },
  { key: "fullName", label: "Full Name" },
  { key: "barangay", label: "Barangay" },
  { key: "sex", label: "Sex" },
  { key: "dateOfBirth", label: "Date of Birth" },
  { key: "status", label: "Status" },
  { key: "categories", label: "Categories" },
];

// Shared Prisma select for fisherfolk-based reports.
const FISHERFOLK_SELECT = {
  id: true,
  idNumber: true,
  fullName: true,
  lastName: true,
  barangay: true,
  sex: true,
  dateOfBirth: true,
  status: true,
  categoryIds: true,
} satisfies Prisma.FisherfolkSelect;

type FisherfolkRecord = Prisma.FisherfolkGetPayload<{
  select: typeof FISHERFOLK_SELECT;
}>;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function computeAge(dob: Date): number {
  const now = new Date();
  return Math.floor(
    (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
}

/** Map a FisherfolkRecord to a standard report Row, resolving category IDs. */
function fisherfolkToRow(
  f: FisherfolkRecord,
  categoryMap: Map<string, string>,
): Row {
  return {
    idNumber: f.idNumber,
    fullName: f.fullName,
    barangay: f.barangay,
    sex: f.sex ?? "",
    dateOfBirth: formatDate(f.dateOfBirth),
    status: f.status,
    categories: f.categoryIds.map((id) => categoryMap.get(id) ?? id).join(", "),
  };
}

/**
 * Build the Prisma dateJoined range filter from the user's date strings.
 * Returns undefined (field omitted) when neither bound is supplied.
 */
function dateJoinedClause(
  filters: Filters,
): Prisma.FisherfolkWhereInput["dateJoined"] {
  if (filters.dateFrom === undefined && filters.dateTo === undefined) {
    return undefined;
  }
  return {
    ...(filters.dateFrom !== undefined
      ? { gte: new Date(filters.dateFrom) }
      : {}),
    ...(filters.dateTo !== undefined
      ? { lte: new Date(filters.dateTo) }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Core: shared report builder (called from both getReport and exportExcel)
// ---------------------------------------------------------------------------

async function buildReport(
  ctx: ReportCtx,
  type: ReportType,
  filters: Filters,
): Promise<ReportResult> {
  const { tenantId } = ctx;
  const title = REPORT_TITLES[type];
  const generatedAt = new Date().toISOString();

  // ── Fisherfolk-based reports ─────────────────────────────────────────────

  if (
    type === "member_list" ||
    type === "new_registrations" ||
    type === "renewed" ||
    type === "inactive" ||
    type === "senior_citizens" ||
    type === "voter_eligible" ||
    type === "family_clusters"
  ) {
    // Resolve category names (small table — full fetch is fine).
    const cats = await ctx.db.category.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(cats.map((c) => [c.id, c.name]));

    // Base where clause — optional filters applied via conditional spread so
    // no property is set to `undefined` (exactOptionalPropertyTypes compat).
    const baseWhere: Prisma.FisherfolkWhereInput = {
      tenantId,
      ...(filters.barangay !== undefined
        ? { barangay: filters.barangay }
        : {}),
      ...(filters.categoryId !== undefined
        ? { categoryIds: { has: filters.categoryId } }
        : {}),
      ...(filters.year !== undefined
        ? { registrationYear: filters.year }
        : {}),
    };

    // Attach date range if supplied (guard avoids undefined property set).
    const djClause = dateJoinedClause(filters);
    if (djClause !== undefined) {
      baseWhere.dateJoined = djClause;
    }

    // ── member_list ──────────────────────────────────────────────────────

    if (type === "member_list") {
      const records = await ctx.db.fisherfolk.findMany({
        where: baseWhere,
        select: FISHERFOLK_SELECT,
        orderBy: { lastName: "asc" },
      });
      const rows = records.map((f) => fisherfolkToRow(f, categoryMap));
      return { title, columns: FISHERFOLK_COLS, rows, generatedAt, count: rows.length };
    }

    // ── new_registrations ────────────────────────────────────────────────

    if (type === "new_registrations") {
      const records = await ctx.db.fisherfolk.findMany({
        where: { ...baseWhere, status: "NEW" },
        select: FISHERFOLK_SELECT,
        orderBy: { lastName: "asc" },
      });
      const rows = records.map((f) => fisherfolkToRow(f, categoryMap));
      return { title, columns: FISHERFOLK_COLS, rows, generatedAt, count: rows.length };
    }

    // ── renewed ──────────────────────────────────────────────────────────

    if (type === "renewed") {
      const records = await ctx.db.fisherfolk.findMany({
        where: { ...baseWhere, status: "RENEWED" },
        select: FISHERFOLK_SELECT,
        orderBy: { lastName: "asc" },
      });
      const rows = records.map((f) => fisherfolkToRow(f, categoryMap));
      return { title, columns: FISHERFOLK_COLS, rows, generatedAt, count: rows.length };
    }

    // ── inactive ─────────────────────────────────────────────────────────

    if (type === "inactive") {
      const records = await ctx.db.fisherfolk.findMany({
        where: { ...baseWhere, status: "INACTIVE" },
        select: FISHERFOLK_SELECT,
        orderBy: { lastName: "asc" },
      });
      const rows = records.map((f) => fisherfolkToRow(f, categoryMap));
      return { title, columns: FISHERFOLK_COLS, rows, generatedAt, count: rows.length };
    }

    // ── senior_citizens (age >= 60 — JS computation mirrors dashboard) ───

    if (type === "senior_citizens") {
      const allRecords = await ctx.db.fisherfolk.findMany({
        where: baseWhere,
        select: FISHERFOLK_SELECT,
        orderBy: { lastName: "asc" },
      });
      const cols: Column[] = [...FISHERFOLK_COLS, { key: "age", label: "Age" }];
      const rows: Row[] = [];
      for (const f of allRecords) {
        if (!f.dateOfBirth) continue;
        const age = computeAge(f.dateOfBirth);
        if (age < 60) continue;
        rows.push({ ...fisherfolkToRow(f, categoryMap), age });
      }
      return { title, columns: cols, rows, generatedAt, count: rows.length };
    }

    // ── voter_eligible (age >= 18) ────────────────────────────────────────

    if (type === "voter_eligible") {
      const allRecords = await ctx.db.fisherfolk.findMany({
        where: baseWhere,
        select: FISHERFOLK_SELECT,
        orderBy: { lastName: "asc" },
      });
      const cols: Column[] = [...FISHERFOLK_COLS, { key: "age", label: "Age" }];
      const rows: Row[] = [];
      for (const f of allRecords) {
        if (!f.dateOfBirth) continue;
        const age = computeAge(f.dateOfBirth);
        if (age < 18) continue;
        rows.push({ ...fisherfolkToRow(f, categoryMap), age });
      }
      return { title, columns: cols, rows, generatedAt, count: rows.length };
    }

    // ── family_clusters (same lastName + barangay, count > 1) ────────────

    if (type === "family_clusters") {
      const allRecords = await ctx.db.fisherfolk.findMany({
        where: baseWhere,
        select: FISHERFOLK_SELECT,
        orderBy: { lastName: "asc" },
      });

      // Group by normalised lastName + barangay.
      const clusterMap = new Map<string, FisherfolkRecord[]>();
      for (const f of allRecords) {
        const key = `${f.lastName.trim().toUpperCase()}|${f.barangay.trim().toUpperCase()}`;
        const existing = clusterMap.get(key);
        if (existing) {
          existing.push(f);
        } else {
          clusterMap.set(key, [f]);
        }
      }

      const cols: Column[] = [
        { key: "lastName", label: "Last Name" },
        { key: "barangay", label: "Barangay" },
        { key: "memberCount", label: "Member Count" },
        { key: "members", label: "Members" },
      ];

      const rows: Row[] = [];
      for (const members of clusterMap.values()) {
        if (members.length <= 1) continue;
        const first = members[0];
        if (!first) continue;
        rows.push({
          lastName: first.lastName,
          barangay: first.barangay,
          memberCount: members.length,
          members: members.map((m) => m.fullName).join(", "),
        });
      }

      // Sort largest cluster first.
      rows.sort((a, b) => Number(b.memberCount) - Number(a.memberCount));

      return { title, columns: cols, rows, generatedAt, count: rows.length };
    }
  }

  // ── violations ───────────────────────────────────────────────────────────

  if (type === "violations") {
    const violationWhere: Prisma.ViolationWhereInput = {
      tenantId,
      ...((filters.dateFrom !== undefined || filters.dateTo !== undefined)
        ? {
            createdAt: {
              ...(filters.dateFrom !== undefined
                ? { gte: new Date(filters.dateFrom) }
                : {}),
              ...(filters.dateTo !== undefined
                ? { lte: new Date(filters.dateTo) }
                : {}),
            },
          }
        : {}),
    };

    const violations = await ctx.db.violation.findMany({
      where: violationWhere,
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
        fisherfolk: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const cols: Column[] = [
      { key: "subject", label: "Subject" },
      { key: "status", label: "Status" },
      { key: "fisherfolk", label: "Fisherfolk" },
      { key: "date", label: "Date Filed" },
    ];

    const rows: Row[] = violations.map((v) => ({
      subject: v.subject,
      status: v.status,
      fisherfolk: v.fisherfolk?.fullName ?? "",
      date: formatDate(v.createdAt),
    }));

    return { title, columns: cols, rows, generatedAt, count: rows.length };
  }

  // ── vessels ──────────────────────────────────────────────────────────────

  if (type === "vessels") {
    const vessels = await ctx.db.vessel.findMany({
      where: { tenantId },
      select: {
        mfvrNumber: true,
        vesselName: true,
        vesselType: true,
        homeport: true,
        status: true,
      },
      orderBy: { vesselName: "asc" },
    });

    const cols: Column[] = [
      { key: "mfvrNumber", label: "MFVR Number" },
      { key: "vesselName", label: "Vessel Name" },
      { key: "vesselType", label: "Type" },
      { key: "homeport", label: "Homeport" },
      { key: "status", label: "Status" },
    ];

    const rows: Row[] = vessels.map((v) => ({
      mfvrNumber: v.mfvrNumber ?? "",
      vesselName: v.vesselName ?? "",
      vesselType: v.vesselType ?? "",
      homeport: v.homeport ?? "",
      status: v.status,
    }));

    return { title, columns: cols, rows, generatedAt, count: rows.length };
  }

  // ── households ───────────────────────────────────────────────────────────

  if (type === "households") {
    const cats = await ctx.db.category.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(cats.map((c) => [c.id, c.name]));

    const householdWhere: Prisma.HouseholdWhereInput = {
      tenantId,
      ...(filters.barangay !== undefined ? { barangay: filters.barangay } : {}),
      ...(filters.categoryId !== undefined
        ? { head: { categoryIds: { has: filters.categoryId } } }
        : {}),
    };

    // TODO(FIS-8 Phase D): per-family rows pending owner decision — kept one
    // row per household (safest default); familyCount is additive.
    const households = await ctx.db.household.findMany({
      where: householdWhere,
      select: {
        householdNumber: true,
        barangay: true,
        address: true,
        head: { select: { fullName: true, categoryIds: true } },
        _count: { select: { members: true, families: true } },
      },
      orderBy: { householdNumber: "asc" },
    });

    const cols: Column[] = [
      { key: "householdNumber", label: "Household Number" },
      { key: "barangay", label: "Barangay" },
      { key: "address", label: "Address" },
      { key: "headName", label: "Head of Household" },
      { key: "headCategory", label: "Head's Category" },
      { key: "memberCount", label: "Member Count" },
      { key: "familyCount", label: "Families" },
    ];

    const rows: Row[] = households.map((h) => ({
      householdNumber: h.householdNumber,
      barangay: h.barangay,
      address: h.address,
      headName: h.head.fullName,
      headCategory: h.head.categoryIds
        .map((id) => categoryMap.get(id) ?? id)
        .join(", "),
      memberCount: h._count.members,
      familyCount: h._count.families,
    }));

    return { title, columns: cols, rows, generatedAt, count: rows.length };
  }

  // TypeScript exhaustiveness guard — should never reach here.
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Unknown report type: ${String(type)}`,
  });
}

// ---------------------------------------------------------------------------
// Excel builder (admin-only)
// ---------------------------------------------------------------------------

export async function buildExcel(
  report: ReportResult,
  filenameHint: string,
): Promise<{ filename: string; base64: string }> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Report");

  // Official government header rows (rows 1-4, blank row 5).
  sheet.addRow(["Republic of the Philippines"]);
  sheet.addRow(["City Government of Calapan"]);
  sheet.addRow(["Fisheries Management Office"]);
  sheet.addRow([report.title]);
  sheet.addRow([]);

  // Column header row (row 6) — bold.
  const headerRow = sheet.addRow(report.columns.map((c) => c.label));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
  });

  // Data rows.
  for (const row of report.rows) {
    sheet.addRow(report.columns.map((c) => row[c.key] ?? ""));
  }

  // writeBuffer() returns Buffer | ArrayBuffer depending on exceljs version.
  const bufferOrAB = await workbook.xlsx.writeBuffer();
  const buf = Buffer.isBuffer(bufferOrAB)
    ? bufferOrAB
    : Buffer.from(bufferOrAB);

  const base64 = buf.toString("base64");
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${filenameHint}_${dateStr}.xlsx`;

  return { filename, base64 };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const reportRouter = createTRPCRouter({
  /**
   * getReport — available to all authenticated users (Viewer and above).
   * Returns structured column/row data suitable for a data table.
   */
  getReport: protectedProcedure
    .input(
      z.object({
        type: reportTypeSchema,
        filters: filtersSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      // Capture narrowed tenantId — closures lose narrowing across async boundaries.
      const tenantId: string = ctx.tenantId;
      return buildReport({ db: ctx.db, tenantId }, input.type, input.filters);
    }),

  /**
   * exportExcel — Admin/Super Admin only.
   * Runs the same query as getReport then serialises to xlsx, returning base64.
   */
  exportExcel: adminProcedure
    .input(
      z.object({
        type: reportTypeSchema,
        filters: filtersSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId: string = ctx.tenantId;
      const report = await buildReport(
        { db: ctx.db, tenantId },
        input.type,
        input.filters,
      );
      return buildExcel(report, input.type);
    }),

  // ── Universal Report Hub (M4 T5) ──────────────────────────────────────────
  // Domain-driven procedures (fisherfolk/household/vessel/violation/ayuda/
  // fish-catch) live in ./report/domain-procedures.ts to keep this file under
  // the dispatch line-budget. Spread in — same router, same auth guards.
  ...domainReportProcedures,
});
