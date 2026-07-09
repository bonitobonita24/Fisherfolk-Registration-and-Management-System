/**
 * where-builders.ts — per-domain Prisma WHERE builders for the universal Report Hub.
 *
 * Each builder takes the shared `UniversalReportFilter` + tenantId and returns a
 * tenant-scoped Prisma `*WhereInput` for its domain. Invalid enum values in the
 * filter are dropped (permissive filtering — never throws on a bad string).
 *
 * TypeScript strict + exactOptionalPropertyTypes.
 */

import type {
  AyudaBeneficiaryStatus,
  GearType,
  Prisma,
  VesselStatus,
  ViolationStatus,
} from "@frms/db";
import {
  AyudaBeneficiaryStatus as AyudaBeneficiaryStatusEnum,
  GearType as GearTypeEnum,
  VesselStatus as VesselStatusEnum,
  ViolationStatus as ViolationStatusEnum,
} from "@frms/db";
import type { UniversalReportFilter } from "@frms/shared/schemas";

// Re-export the existing fisherfolk WHERE builder (shared with Ayuda bulk-add search).
export { buildFisherfolkFilterWhere } from "../ayuda";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Filter an array of strings down to the values that are valid members of `enumObj`. */
function pickEnum<T extends string>(
  values: string[],
  enumObj: Record<string, T>,
): T[] {
  const valid = new Set<string>(Object.values(enumObj));
  return values.filter((v): v is T => valid.has(v));
}

/** End-of-day Date for an ISO `date` string (YYYY-MM-DD), used as an inclusive upper bound. */
function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

function dateRange(
  dateFrom: string | undefined,
  dateTo: string | undefined,
): Prisma.DateTimeFilter | undefined {
  if (dateFrom === undefined && dateTo === undefined) return undefined;
  const range: Prisma.DateTimeFilter = {};
  if (dateFrom !== undefined) range.gte = new Date(dateFrom);
  if (dateTo !== undefined) range.lte = endOfDay(dateTo);
  return range;
}

// ─── Household ──────────────────────────────────────────────────────────────

export function buildHouseholdFilterWhere(
  filter: UniversalReportFilter,
  tenantId: string,
): Prisma.HouseholdWhereInput {
  const where: Prisma.HouseholdWhereInput = { tenantId };

  if (filter.barangays !== undefined && filter.barangays.length > 0) {
    where.barangay = { in: filter.barangays };
  }

  return where;
}

// ─── Vessel ─────────────────────────────────────────────────────────────────

export function buildVesselFilterWhere(
  filter: UniversalReportFilter,
  tenantId: string,
): Prisma.VesselWhereInput {
  const where: Prisma.VesselWhereInput = { tenantId };

  if (filter.barangays !== undefined && filter.barangays.length > 0) {
    where.homeport = { in: filter.barangays };
  }
  if (filter.vesselTypes !== undefined && filter.vesselTypes.length > 0) {
    where.vesselType = { in: filter.vesselTypes };
  }
  if (filter.statuses !== undefined && filter.statuses.length > 0) {
    const statuses = pickEnum<VesselStatus>(filter.statuses, VesselStatusEnum);
    if (statuses.length > 0) where.status = { in: statuses };
  }

  return where;
}

// ─── Violation ──────────────────────────────────────────────────────────────

export function buildViolationFilterWhere(
  filter: UniversalReportFilter,
  tenantId: string,
): Prisma.ViolationWhereInput {
  const where: Prisma.ViolationWhereInput = { tenantId };

  if (filter.statuses !== undefined && filter.statuses.length > 0) {
    const statuses = pickEnum<ViolationStatus>(
      filter.statuses,
      ViolationStatusEnum,
    );
    if (statuses.length > 0) where.status = { in: statuses };
  }

  const createdAt = dateRange(filter.dateFrom, filter.dateTo);
  if (createdAt !== undefined) where.createdAt = createdAt;

  return where;
}

// ─── Ayuda Beneficiary ──────────────────────────────────────────────────────

export function buildAyudaBeneficiaryFilterWhere(
  filter: UniversalReportFilter,
  tenantId: string,
): Prisma.AyudaBeneficiaryWhereInput {
  const where: Prisma.AyudaBeneficiaryWhereInput = { tenantId };

  if (filter.programId !== undefined) {
    where.programId = filter.programId;
  }
  if (filter.statuses !== undefined && filter.statuses.length > 0) {
    const statuses = pickEnum<AyudaBeneficiaryStatus>(
      filter.statuses,
      AyudaBeneficiaryStatusEnum,
    );
    if (statuses.length > 0) where.verificationStatus = { in: statuses };
  }

  const createdAt = dateRange(filter.dateFrom, filter.dateTo);
  if (createdAt !== undefined) where.createdAt = createdAt;

  return where;
}

// ─── Fish Catch ─────────────────────────────────────────────────────────────

export function buildFishCatchFilterWhere(
  filter: UniversalReportFilter,
  tenantId: string,
): Prisma.FishCatchWhereInput {
  const where: Prisma.FishCatchWhereInput = { tenantId };

  if (filter.gearType !== undefined) {
    const [gearType] = pickEnum<GearType>([filter.gearType], GearTypeEnum);
    if (gearType !== undefined) where.gearType = gearType;
  }
  if (filter.barangays !== undefined && filter.barangays.length > 0) {
    where.fishingGroundBarangay = { in: filter.barangays };
  }

  const landingDate = dateRange(filter.dateFrom, filter.dateTo);
  if (landingDate !== undefined) where.landingDate = landingDate;

  return where;
}
