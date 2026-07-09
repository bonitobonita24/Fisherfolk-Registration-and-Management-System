/**
 * domain-procedures.ts — universal Report Hub tRPC procedures (M4 T5).
 *
 * Wires where-builders.ts (M4 T2) + domain-columns.ts (M4 T3) +
 * domain-charts.ts (M4 T4) into four procedures spread into `reportRouter`
 * (see ../report.ts): getDomainReport, getDomainChartData, getDomainFacets,
 * exportDomainExcel. Kept in its own file to keep report.ts under the
 * 500-line dispatch budget.
 *
 * TypeScript strict + exactOptionalPropertyTypes.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  AyudaBeneficiaryStatus as AyudaBeneficiaryStatusEnum,
  FisherfolkStatus as FisherfolkStatusEnum,
  VesselStatus as VesselStatusEnum,
  ViolationStatus as ViolationStatusEnum,
} from "@frms/db";
import {
  FISHERFOLK_STATUS_VALUES,
  reportDomainSchema,
  universalReportFilterSchema,
  type AyudaBeneficiaryFilter,
  type ReportDomain,
  type UniversalReportFilter,
} from "@frms/shared/schemas";
import { GEAR_TYPES } from "@frms/shared/constants";

import { adminProcedure, protectedProcedure } from "../../trpc";
import type { TRPCContext } from "../../context";
import { buildExcel, type ReportResult } from "../report";
import { DOMAIN_REPORT_DEFS } from "./domain-columns";
import { getDomainChartData as computeDomainChartData } from "./domain-charts";
import {
  buildAyudaBeneficiaryFilterWhere,
  buildFishCatchFilterWhere,
  buildFisherfolkFilterWhere,
  buildHouseholdFilterWhere,
  buildVesselFilterWhere,
  buildViolationFilterWhere,
} from "./where-builders";

// ---------------------------------------------------------------------------
// Shared ctx shape (mirrors ../report.ts's ReportCtx)
// ---------------------------------------------------------------------------

type ReportCtx = {
  db: TRPCContext["db"];
  tenantId: string;
};

/** Ledger row cap — mirrors ayuda.filterFacetOptions-adjacent bulk queries. */
const DOMAIN_TAKE_CAP = 5000;

// ---------------------------------------------------------------------------
// Adapter — UniversalReportFilter → the narrower AyudaBeneficiaryFilter shape
// the shared fisherfolk WHERE builder expects (mirrors domain-charts.ts).
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Core: shared domain-ledger builder (called from getDomainReport AND
// exportDomainExcel to avoid duplicating the query/mapping logic).
// ---------------------------------------------------------------------------

async function buildDomainReport(
  ctx: ReportCtx,
  domain: ReportDomain,
  filter: UniversalReportFilter,
): Promise<ReportResult> {
  const { db, tenantId } = ctx;
  const generatedAt = new Date().toISOString();

  switch (domain) {
    case "fisherfolk": {
      const def = DOMAIN_REPORT_DEFS.fisherfolk;
      const where = buildFisherfolkFilterWhere(
        toFisherfolkFilter(filter),
        tenantId,
        new Date(),
      );
      const records = await db.fisherfolk.findMany({
        where,
        select: def.select,
        orderBy: { fullName: "asc" },
        take: DOMAIN_TAKE_CAP,
      });
      const rows = records.map((r) => def.mapRow(r));
      return { title: def.title, columns: def.columns, rows, generatedAt, count: rows.length };
    }

    case "household": {
      const def = DOMAIN_REPORT_DEFS.household;
      const where = buildHouseholdFilterWhere(filter, tenantId);
      const records = await db.household.findMany({
        where,
        select: def.select,
        orderBy: { householdNumber: "asc" },
        take: DOMAIN_TAKE_CAP,
      });
      const rows = records.map((r) => def.mapRow(r));
      return { title: def.title, columns: def.columns, rows, generatedAt, count: rows.length };
    }

    case "vessel": {
      const def = DOMAIN_REPORT_DEFS.vessel;
      const where = buildVesselFilterWhere(filter, tenantId);
      const records = await db.vessel.findMany({
        where,
        select: def.select,
        orderBy: { vesselName: "asc" },
        take: DOMAIN_TAKE_CAP,
      });
      const rows = records.map((r) => def.mapRow(r));
      return { title: def.title, columns: def.columns, rows, generatedAt, count: rows.length };
    }

    case "violation": {
      const def = DOMAIN_REPORT_DEFS.violation;
      const where = buildViolationFilterWhere(filter, tenantId);
      const records = await db.violation.findMany({
        where,
        select: def.select,
        orderBy: { createdAt: "desc" },
        take: DOMAIN_TAKE_CAP,
      });
      const rows = records.map((r) => def.mapRow(r));
      return { title: def.title, columns: def.columns, rows, generatedAt, count: rows.length };
    }

    case "ayuda": {
      const def = DOMAIN_REPORT_DEFS.ayuda;
      const where = buildAyudaBeneficiaryFilterWhere(filter, tenantId);
      const records = await db.ayudaBeneficiary.findMany({
        where,
        select: def.select,
        orderBy: { createdAt: "desc" },
        take: DOMAIN_TAKE_CAP,
      });
      const rows = records.map((r) => def.mapRow(r));
      return { title: def.title, columns: def.columns, rows, generatedAt, count: rows.length };
    }

    case "fish-catch": {
      const def = DOMAIN_REPORT_DEFS["fish-catch"];
      const where = buildFishCatchFilterWhere(filter, tenantId);
      const records = await db.fishCatch.findMany({
        where,
        select: def.select,
        orderBy: { landingDate: "desc" },
        take: DOMAIN_TAKE_CAP,
      });
      const rows = records.map((r) => def.mapRow(r));
      return { title: def.title, columns: def.columns, rows, generatedAt, count: rows.length };
    }
  }
}

// ---------------------------------------------------------------------------
// Facets — per-domain filter-control option lists.
// ---------------------------------------------------------------------------

async function barangayFacet(
  db: ReportCtx["db"],
  domain: ReportDomain,
  tenantId: string,
): Promise<string[]> {
  switch (domain) {
    case "fisherfolk":
    case "violation":
    case "ayuda": {
      const rows = await db.fisherfolk.findMany({
        where: { tenantId },
        distinct: ["barangay"],
        select: { barangay: true },
      });
      return rows.map((r) => r.barangay).filter((b) => b.length > 0).sort((a, b) => a.localeCompare(b));
    }
    case "household": {
      const rows = await db.household.findMany({
        where: { tenantId },
        distinct: ["barangay"],
        select: { barangay: true },
      });
      return rows.map((r) => r.barangay).filter((b) => b.length > 0).sort((a, b) => a.localeCompare(b));
    }
    case "vessel": {
      const rows = await db.vessel.findMany({
        where: { tenantId },
        distinct: ["homeport"],
        select: { homeport: true },
      });
      return rows
        .map((r) => r.homeport)
        .filter((h): h is string => h !== null && h.length > 0)
        .sort((a, b) => a.localeCompare(b));
    }
    case "fish-catch": {
      const rows = await db.fishCatch.findMany({
        where: { tenantId },
        distinct: ["fishingGroundBarangay"],
        select: { fishingGroundBarangay: true },
      });
      return rows
        .map((r) => r.fishingGroundBarangay)
        .filter((b): b is string => b !== null && b.length > 0)
        .sort((a, b) => a.localeCompare(b));
    }
  }
}

function statusValuesForDomain(domain: ReportDomain): string[] {
  switch (domain) {
    case "fisherfolk":
      return Object.values(FisherfolkStatusEnum);
    case "vessel":
      return Object.values(VesselStatusEnum);
    case "violation":
      return Object.values(ViolationStatusEnum);
    case "ayuda":
      return Object.values(AyudaBeneficiaryStatusEnum);
    case "household":
    case "fish-catch":
      return [];
  }
}

// ---------------------------------------------------------------------------
// Procedures — spread into reportRouter (see ../report.ts)
// ---------------------------------------------------------------------------

export const domainReportProcedures = {
  /**
   * getDomainReport — the universal Report Hub ledger table (all domains).
   * Available to all authenticated users (Viewer and above).
   */
  getDomainReport: protectedProcedure
    .input(
      z.object({
        domain: reportDomainSchema,
        filter: universalReportFilterSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId: string = ctx.tenantId;
      return buildDomainReport({ db: ctx.db, tenantId }, input.domain, input.filter);
    }),

  /**
   * getDomainChartData — per-domain chart aggregations, filtered by the same
   * WHERE clause as the ledger so charts and table rows always reconcile.
   */
  getDomainChartData: protectedProcedure
    .input(
      z.object({
        domain: reportDomainSchema,
        filter: universalReportFilterSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId: string = ctx.tenantId;
      return computeDomainChartData(ctx.db, input.domain, input.filter, tenantId);
    }),

  /**
   * getDomainFacets — filter-control option lists for the given domain
   * (barangays/categories/vesselTypes/statuses/gearTypes/programs).
   */
  getDomainFacets: protectedProcedure
    .input(z.object({ domain: reportDomainSchema }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId: string = ctx.tenantId;
      const { domain } = input;

      const usesCategories =
        domain === "fisherfolk" || domain === "violation" || domain === "ayuda";
      const usesVesselTypes = domain === "fisherfolk" || domain === "vessel";

      const [barangays, categories, vesselTypeRows, programs] = await Promise.all([
        barangayFacet(ctx.db, domain, tenantId),
        usesCategories
          ? ctx.db.category.findMany({
              where: { tenantId, status: "ACTIVE" },
              select: { id: true, name: true },
              orderBy: { name: "asc" },
            })
          : Promise.resolve([]),
        usesVesselTypes
          ? ctx.db.vessel.findMany({
              where: { tenantId },
              distinct: ["vesselType"],
              select: { vesselType: true },
            })
          : Promise.resolve([]),
        domain === "ayuda"
          ? ctx.db.ayudaProgram.findMany({
              where: { tenantId },
              select: { id: true, title: true },
              orderBy: { title: "asc" },
            })
          : Promise.resolve([]),
      ]);

      const vesselTypes = vesselTypeRows
        .map((r) => r.vesselType)
        .filter((v) => v.length > 0)
        .sort((a, b) => a.localeCompare(b));

      return {
        barangays,
        categories,
        vesselTypes,
        statuses: statusValuesForDomain(domain),
        gearTypes: domain === "fish-catch" ? [...GEAR_TYPES] : [],
        programs,
      };
    }),

  /**
   * exportDomainExcel — Admin/Super Admin only. Reuses buildDomainReport so
   * the ledger and the exported workbook always match.
   */
  exportDomainExcel: adminProcedure
    .input(
      z.object({
        domain: reportDomainSchema,
        filter: universalReportFilterSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId: string = ctx.tenantId;
      const report = await buildDomainReport(
        { db: ctx.db, tenantId },
        input.domain,
        input.filter,
      );
      return buildExcel(report, `${input.domain}-report`);
    }),
};
