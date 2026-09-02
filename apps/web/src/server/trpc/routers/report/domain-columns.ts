/**
 * domain-columns.ts — per-domain column definitions, Prisma selects, and row
 * mappers for the universal Report Hub ledger (M4 T3).
 *
 * This module defines HOW each domain's records become { columns, rows }
 * matching the existing ReportResult contract (see ../report.ts). It does
 * NOT run any queries — the actual findMany() calls happen in the ledger
 * builder (T5) which imports DOMAIN_REPORT_DEFS and drives select/mapRow
 * against each domain's Prisma model.
 *
 * Style mirrors ../report.ts (FISHERFOLK_SELECT / FISHERFOLK_COLS / computeAge).
 */

import type { Prisma } from "@frms/db";
import type { ReportDomain } from "@frms/shared/schemas";
import { GEAR_TYPE_LABELS } from "@frms/shared/constants";

// ---------------------------------------------------------------------------
// Shared output types (mirrors ../report.ts Column/Row/ReportResult contract)
// ---------------------------------------------------------------------------

type Column = { key: string; label: string };
type Row = Record<string, string | number>;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

/** Local copy of ../report.ts's computeAge — kept self-contained per T3 contract. */
function computeAge(dob: Date): number {
  const now = new Date();
  return Math.floor(
    (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
}

function decimalToNumber(d: Prisma.Decimal | number | null | undefined): number {
  if (d === null || d === undefined) return 0;
  return typeof d === "number" ? d : Number(d);
}

// ---------------------------------------------------------------------------
// fisherfolk
// ---------------------------------------------------------------------------

const FISHERFOLK_SELECT = {
  idNumber: true,
  fullName: true,
  sex: true,
  dateOfBirth: true,
  civilStatus: true,
  barangay: true,
  status: true,
  dateJoined: true,
  employmentType: true,
  primarySourceOfIncome: true,
} satisfies Prisma.FisherfolkSelect;

type FisherfolkRow = Prisma.FisherfolkGetPayload<{ select: typeof FISHERFOLK_SELECT }>;

const FISHERFOLK_COLUMNS: Column[] = [
  { key: "idNumber", label: "ID Number" },
  { key: "fullName", label: "Full Name" },
  { key: "sex", label: "Sex" },
  { key: "age", label: "Age" },
  { key: "barangay", label: "Barangay" },
  { key: "civilStatus", label: "Civil Status" },
  { key: "status", label: "Status" },
  { key: "dateJoined", label: "Date Joined" },
  { key: "employmentType", label: "Employment Type" },
  { key: "primarySourceOfIncome", label: "Primary Source of Income" },
];

function mapFisherfolkRow(f: FisherfolkRow): Row {
  return {
    idNumber: f.idNumber,
    fullName: f.fullName,
    sex: f.sex ?? "",
    age: f.dateOfBirth ? computeAge(f.dateOfBirth) : "",
    barangay: f.barangay,
    civilStatus: f.civilStatus ?? "",
    status: f.status,
    dateJoined: formatDate(f.dateJoined),
    employmentType: f.employmentType ?? "",
    primarySourceOfIncome: f.primarySourceOfIncome ?? "",
  };
}

// ---------------------------------------------------------------------------
// household
// ---------------------------------------------------------------------------

const HOUSEHOLD_SELECT = {
  householdNumber: true,
  barangay: true,
  address: true,
  head: { select: { fullName: true } },
  _count: { select: { members: true } },
} satisfies Prisma.HouseholdSelect;

type HouseholdRow = Prisma.HouseholdGetPayload<{ select: typeof HOUSEHOLD_SELECT }>;

const HOUSEHOLD_COLUMNS: Column[] = [
  { key: "householdNumber", label: "Household Number" },
  { key: "barangay", label: "Barangay" },
  { key: "address", label: "Address" },
  { key: "headName", label: "Head of Household" },
  { key: "memberCount", label: "Member Count" },
];

function mapHouseholdRow(h: HouseholdRow): Row {
  return {
    householdNumber: h.householdNumber,
    barangay: h.barangay,
    address: h.address,
    headName: h.head.fullName,
    memberCount: h._count.members,
  };
}

// ---------------------------------------------------------------------------
// vessel
// ---------------------------------------------------------------------------

const VESSEL_SELECT = {
  mfvrNumber: true,
  vesselName: true,
  vesselType: true,
  homeport: true,
  status: true,
  owners: { select: { fullName: true } },
} satisfies Prisma.VesselSelect;

type VesselRow = Prisma.VesselGetPayload<{ select: typeof VESSEL_SELECT }>;

const VESSEL_COLUMNS: Column[] = [
  { key: "mfvrNumber", label: "MFVR Number" },
  { key: "vesselName", label: "Vessel Name" },
  { key: "vesselType", label: "Type" },
  { key: "homeport", label: "Homeport" },
  { key: "status", label: "Status" },
  { key: "ownerName", label: "Owner" },
];

function mapVesselRow(v: VesselRow): Row {
  // Vessel↔Fisherfolk is many-to-many (owners[]); the report surfaces the
  // first linked owner (typical case is a single owner per vessel).
  return {
    mfvrNumber: v.mfvrNumber,
    vesselName: v.vesselName ?? "",
    vesselType: v.vesselType,
    homeport: v.homeport ?? "",
    status: v.status,
    ownerName: v.owners[0]?.fullName ?? "",
  };
}

// ---------------------------------------------------------------------------
// violation
// ---------------------------------------------------------------------------

const VIOLATION_SELECT = {
  subject: true,
  status: true,
  createdAt: true,
  fisherfolk: { select: { fullName: true } },
  vessel: { select: { vesselName: true, mfvrNumber: true } },
} satisfies Prisma.ViolationSelect;

type ViolationRow = Prisma.ViolationGetPayload<{ select: typeof VIOLATION_SELECT }>;

const VIOLATION_COLUMNS: Column[] = [
  { key: "subject", label: "Subject" },
  { key: "status", label: "Status" },
  { key: "fisherfolkName", label: "Fisherfolk" },
  { key: "vesselName", label: "Vessel" },
  { key: "createdAt", label: "Date Filed" },
];

function mapViolationRow(v: ViolationRow): Row {
  return {
    subject: v.subject,
    status: v.status,
    fisherfolkName: v.fisherfolk?.fullName ?? "",
    vesselName: v.vessel?.vesselName ?? v.vessel?.mfvrNumber ?? "",
    createdAt: formatDate(v.createdAt),
  };
}

// ---------------------------------------------------------------------------
// ayuda
// ---------------------------------------------------------------------------

const AYUDA_SELECT = {
  verificationStatus: true,
  createdAt: true,
  fisherfolk: { select: { fullName: true } },
  program: { select: { title: true, distributionUnit: true } },
} satisfies Prisma.AyudaBeneficiarySelect;

type AyudaRow = Prisma.AyudaBeneficiaryGetPayload<{ select: typeof AYUDA_SELECT }>;

const AYUDA_COLUMNS: Column[] = [
  { key: "programTitle", label: "Program" },
  { key: "fisherfolkName", label: "Fisherfolk" },
  { key: "verificationStatus", label: "Verification Status" },
  { key: "distributionUnit", label: "Distribution Unit" },
  { key: "createdAt", label: "Date Added" },
];

function mapAyudaRow(a: AyudaRow): Row {
  return {
    programTitle: a.program.title,
    fisherfolkName: a.fisherfolk.fullName,
    verificationStatus: a.verificationStatus,
    distributionUnit: a.program.distributionUnit,
    createdAt: formatDate(a.createdAt),
  };
}

// ---------------------------------------------------------------------------
// fish-catch
// ---------------------------------------------------------------------------

const FISH_CATCH_SELECT = {
  referenceNo: true,
  landingDate: true,
  fishingGroundBarangay: true,
  gearType: true,
  totalCatchKg: true,
  fisherfolk: { select: { fullName: true } },
  vessel: { select: { vesselName: true, mfvrNumber: true } },
} satisfies Prisma.FishCatchSelect;

type FishCatchRow = Prisma.FishCatchGetPayload<{ select: typeof FISH_CATCH_SELECT }>;

const FISH_CATCH_COLUMNS: Column[] = [
  { key: "referenceNo", label: "Reference No." },
  { key: "fisherfolkName", label: "Fisherfolk" },
  { key: "vesselName", label: "Vessel" },
  { key: "landingDate", label: "Landing Date" },
  { key: "fishingGroundBarangay", label: "Fishing Ground (Barangay)" },
  { key: "gearType", label: "Gear Type" },
  { key: "totalCatchKg", label: "Total Catch (kg)" },
];

function mapFishCatchRow(f: FishCatchRow): Row {
  return {
    referenceNo: f.referenceNo,
    fisherfolkName: f.fisherfolk.fullName,
    vesselName: f.vessel?.vesselName ?? f.vessel?.mfvrNumber ?? "",
    landingDate: formatDate(f.landingDate),
    fishingGroundBarangay: f.fishingGroundBarangay ?? "",
    gearType: GEAR_TYPE_LABELS[f.gearType],
    totalCatchKg: decimalToNumber(f.totalCatchKg),
  };
}

// ---------------------------------------------------------------------------
// Registry — DOMAIN_REPORT_DEFS
// ---------------------------------------------------------------------------

/**
 * DomainReportDef<TSelect, TPayload> — a self-describing recipe for turning
 * one domain's Prisma records into a ReportResult { columns, rows } shape.
 * The ledger builder (T5) is expected to call:
 *   db.<model>.findMany({ where, select: def.select })
 *   then def.mapRow(record) for each record.
 */
type DomainReportDef<TSelect, TPayload> = {
  title: string;
  select: TSelect;
  columns: Column[];
  mapRow: (record: TPayload) => Row;
};

export const DOMAIN_REPORT_DEFS = {
  fisherfolk: {
    title: "Fisherfolk Ledger",
    select: FISHERFOLK_SELECT,
    columns: FISHERFOLK_COLUMNS,
    mapRow: mapFisherfolkRow,
  } satisfies DomainReportDef<typeof FISHERFOLK_SELECT, FisherfolkRow>,

  household: {
    title: "Household Ledger",
    select: HOUSEHOLD_SELECT,
    columns: HOUSEHOLD_COLUMNS,
    mapRow: mapHouseholdRow,
  } satisfies DomainReportDef<typeof HOUSEHOLD_SELECT, HouseholdRow>,

  vessel: {
    title: "Vessel Ledger",
    select: VESSEL_SELECT,
    columns: VESSEL_COLUMNS,
    mapRow: mapVesselRow,
  } satisfies DomainReportDef<typeof VESSEL_SELECT, VesselRow>,

  violation: {
    title: "Violation Ledger",
    select: VIOLATION_SELECT,
    columns: VIOLATION_COLUMNS,
    mapRow: mapViolationRow,
  } satisfies DomainReportDef<typeof VIOLATION_SELECT, ViolationRow>,

  ayuda: {
    title: "Ayuda Beneficiary Ledger",
    select: AYUDA_SELECT,
    columns: AYUDA_COLUMNS,
    mapRow: mapAyudaRow,
  } satisfies DomainReportDef<typeof AYUDA_SELECT, AyudaRow>,

  "fish-catch": {
    title: "Fish Catch Ledger",
    select: FISH_CATCH_SELECT,
    columns: FISH_CATCH_COLUMNS,
    mapRow: mapFishCatchRow,
  } satisfies DomainReportDef<typeof FISH_CATCH_SELECT, FishCatchRow>,
} satisfies Record<ReportDomain, DomainReportDef<unknown, never>>;
