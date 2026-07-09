/**
 * domain-charts.ts — per-domain chart aggregators for the universal Report Hub.
 *
 * Each domain returns 2-3 small aggregations ({label, value}[]) computed with the
 * SAME tenant-scoped WHERE clause as the ledger (via where-builders.ts), so the
 * charts and the ledger table always reconcile against the same filtered rowset.
 *
 * TypeScript strict + exactOptionalPropertyTypes.
 */

import { GEAR_TYPE_LABELS } from "@frms/shared/constants";
import {
  FISHERFOLK_STATUS_VALUES,
  type AyudaBeneficiaryFilter,
  type ReportDomain,
  type UniversalReportFilter,
} from "@frms/shared/schemas";

import type { ExtendedPrismaClient } from "@frms/db";

import {
  buildAyudaBeneficiaryFilterWhere,
  buildFishCatchFilterWhere,
  buildFisherfolkFilterWhere,
  buildHouseholdFilterWhere,
  buildVesselFilterWhere,
  buildViolationFilterWhere,
} from "./where-builders";

export interface ChartSeries {
  key: string;
  title: string;
  data: { label: string; value: number }[];
}
export interface DomainChartData {
  charts: ChartSeries[];
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

/** Prisma `Decimal` fields serialize to opaque objects over the wire. */
function decToNum(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const v = value as { toNumber?: () => number };
  return typeof v.toNumber === "function" ? v.toNumber() : Number(value);
}

/** Tally group keys into {label, value} pairs, dropping null/empty keys. */
function tally(
  keys: (string | null | undefined)[],
  labelFor: (key: string) => string = (k) => k,
): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const k of keys) {
    if (k === null || k === undefined || k === "") continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([k, value]) => ({ label: labelFor(k), value }));
}

/** Sort a {label,value}[] by value descending and keep the top N. */
function topN(
  data: { label: string; value: number }[],
  n: number,
): { label: string; value: number }[] {
  return [...data].sort((a, b) => b.value - a.value).slice(0, n);
}

/** Bucket a set of dates into `YYYY-MM` month labels, summing a numeric value per record. */
function monthlyBuckets(
  records: { date: Date; amount: number }[],
): { label: string; value: number }[] {
  const buckets = new Map<string, number>();
  for (const r of records) {
    const d = new Date(r.date);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(month, (buckets.get(month) ?? 0) + r.amount);
  }
  return Array.from(buckets.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
}

/** Adapt `UniversalReportFilter` (plain `string[]` statuses) into the narrower
 *  `AyudaBeneficiaryFilter` shape the shared fisherfolk WHERE builder expects. */
function toFisherfolkFilter(
  filter: UniversalReportFilter,
): AyudaBeneficiaryFilter {
  const validStatuses = new Set<string>(FISHERFOLK_STATUS_VALUES);
  const statuses = filter.statuses?.filter((s) => validStatuses.has(s)) as
    | (typeof FISHERFOLK_STATUS_VALUES)[number][]
    | undefined;

  return {
    ...(filter.barangays !== undefined && { barangays: filter.barangays }),
    ...(filter.categoryIds !== undefined && { categoryIds: filter.categoryIds }),
    ...(statuses !== undefined && statuses.length > 0 && { statuses }),
    ...(filter.vesselTypes !== undefined && { vesselTypes: filter.vesselTypes }),
    ...(filter.vesselOwner !== undefined && { vesselOwner: filter.vesselOwner }),
    ...(filter.ageMin !== undefined && { ageMin: filter.ageMin }),
    ...(filter.ageMax !== undefined && { ageMax: filter.ageMax }),
  };
}

// ─── Per-domain aggregators ─────────────────────────────────────────────────

async function fisherfolkCharts(
  db: ExtendedPrismaClient,
  filter: UniversalReportFilter,
  tenantId: string,
): Promise<ChartSeries[]> {
  const where = buildFisherfolkFilterWhere(
    toFisherfolkFilter(filter),
    tenantId,
    new Date(),
  );
  const rows = await db.fisherfolk.findMany({
    where,
    select: { barangay: true, status: true, registrationYear: true },
  });

  const byRegistrationYear = new Map<string, number>();
  for (const r of rows) {
    const label = String(r.registrationYear);
    byRegistrationYear.set(label, (byRegistrationYear.get(label) ?? 0) + 1);
  }

  return [
    { key: "byBarangay", title: "By Barangay", data: topN(tally(rows.map((r) => r.barangay)), 12) },
    { key: "byStatus", title: "By Status", data: tally(rows.map((r) => r.status)) },
    {
      key: "byRegistrationYear",
      title: "By Registration Year",
      data: Array.from(byRegistrationYear.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0)),
    },
  ];
}

async function householdCharts(
  db: ExtendedPrismaClient,
  filter: UniversalReportFilter,
  tenantId: string,
): Promise<ChartSeries[]> {
  const where = buildHouseholdFilterWhere(filter, tenantId);
  const rows = await db.household.findMany({
    where,
    select: {
      barangay: true,
      head: { select: { sex: true } },
      _count: { select: { members: true } },
    },
  });

  const sizeBuckets = new Map<string, number>([
    ["1", 0],
    ["2-3", 0],
    ["4-5", 0],
    ["6+", 0],
  ]);
  for (const r of rows) {
    // _count.members counts only additional household members (head is separate).
    const size = r._count.members + 1;
    const bucket = size <= 1 ? "1" : size <= 3 ? "2-3" : size <= 5 ? "4-5" : "6+";
    sizeBuckets.set(bucket, (sizeBuckets.get(bucket) ?? 0) + 1);
  }

  return [
    { key: "byBarangay", title: "By Barangay", data: topN(tally(rows.map((r) => r.barangay)), 12) },
    {
      key: "sizeDistribution",
      title: "Household Size",
      data: Array.from(sizeBuckets.entries()).map(([label, value]) => ({ label, value })),
    },
    {
      key: "headBySex",
      title: "Household Head by Sex",
      data: tally(rows.map((r) => r.head.sex ?? undefined)),
    },
  ];
}

async function vesselCharts(
  db: ExtendedPrismaClient,
  filter: UniversalReportFilter,
  tenantId: string,
): Promise<ChartSeries[]> {
  const where = buildVesselFilterWhere(filter, tenantId);
  const rows = await db.vessel.findMany({
    where,
    select: { vesselType: true, status: true, homeport: true },
  });

  return [
    { key: "byVesselType", title: "By Vessel Type", data: tally(rows.map((r) => r.vesselType)) },
    { key: "byStatus", title: "By Status", data: tally(rows.map((r) => r.status)) },
    { key: "byHomeport", title: "By Homeport", data: topN(tally(rows.map((r) => r.homeport)), 10) },
  ];
}

async function violationCharts(
  db: ExtendedPrismaClient,
  filter: UniversalReportFilter,
  tenantId: string,
): Promise<ChartSeries[]> {
  const where = buildViolationFilterWhere(filter, tenantId);
  const rows = await db.violation.findMany({
    where,
    select: {
      status: true,
      createdAt: true,
      fisherfolk: { select: { barangay: true } },
    },
  });

  return [
    { key: "byStatus", title: "By Status", data: tally(rows.map((r) => r.status)) },
    {
      key: "overTime",
      title: "Over Time",
      data: monthlyBuckets(rows.map((r) => ({ date: r.createdAt, amount: 1 }))),
    },
    {
      key: "byBarangay",
      title: "By Barangay",
      data: topN(tally(rows.map((r) => r.fisherfolk?.barangay)), 12),
    },
  ];
}

async function ayudaCharts(
  db: ExtendedPrismaClient,
  filter: UniversalReportFilter,
  tenantId: string,
): Promise<ChartSeries[]> {
  const where = buildAyudaBeneficiaryFilterWhere(filter, tenantId);
  const rows = await db.ayudaBeneficiary.findMany({
    where,
    select: {
      verificationStatus: true,
      createdAt: true,
      program: { select: { title: true } },
    },
  });

  return [
    {
      key: "byVerificationStatus",
      title: "By Verification Status",
      data: tally(rows.map((r) => r.verificationStatus)),
    },
    { key: "byProgram", title: "By Program", data: topN(tally(rows.map((r) => r.program.title)), 12) },
    {
      key: "overTime",
      title: "Over Time",
      data: monthlyBuckets(rows.map((r) => ({ date: r.createdAt, amount: 1 }))),
    },
  ];
}

async function fishCatchCharts(
  db: ExtendedPrismaClient,
  filter: UniversalReportFilter,
  tenantId: string,
): Promise<ChartSeries[]> {
  const where = buildFishCatchFilterWhere(filter, tenantId);
  const rows = await db.fishCatch.findMany({
    where,
    select: {
      landingDate: true,
      totalCatchKg: true,
      gearType: true,
      fishingGroundBarangay: true,
    },
  });

  return [
    {
      key: "catchOverTime",
      title: "Catch Over Time (kg)",
      data: monthlyBuckets(
        rows.map((r) => ({
          date: r.landingDate,
          amount: decToNum(r.totalCatchKg),
        })),
      ),
    },
    {
      key: "byGearType",
      title: "By Gear Type",
      data: tally(rows.map((r) => r.gearType), (k) =>
        GEAR_TYPE_LABELS[k as keyof typeof GEAR_TYPE_LABELS] ?? k,
      ),
    },
    {
      key: "byBarangay",
      title: "By Fishing Ground Barangay",
      data: topN(tally(rows.map((r) => r.fishingGroundBarangay)), 12),
    },
  ];
}

// ─── Entry point ────────────────────────────────────────────────────────────

export async function getDomainChartData(
  db: ExtendedPrismaClient,
  domain: ReportDomain,
  filter: UniversalReportFilter,
  tenantId: string,
): Promise<DomainChartData> {
  switch (domain) {
    case "fisherfolk":
      return { charts: await fisherfolkCharts(db, filter, tenantId) };
    case "household":
      return { charts: await householdCharts(db, filter, tenantId) };
    case "vessel":
      return { charts: await vesselCharts(db, filter, tenantId) };
    case "violation":
      return { charts: await violationCharts(db, filter, tenantId) };
    case "ayuda":
      return { charts: await ayudaCharts(db, filter, tenantId) };
    case "fish-catch":
      return { charts: await fishCatchCharts(db, filter, tenantId) };
  }
}
