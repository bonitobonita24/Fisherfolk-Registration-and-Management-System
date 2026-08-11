import type { ReportDomain, UniversalReportFilter } from "@frms/shared/schemas";

// ── Domain labels ─────────────────────────────────────────────────────────────
export const DOMAIN_LABELS: Record<ReportDomain, string> = {
  fisherfolk: "Fisherfolk",
  household: "Household",
  vessel: "Vessel",
  violation: "Violation",
  ayuda: "Ayuda",
  "fish-catch": "Fish Catch",
};

export const DOMAINS = Object.keys(DOMAIN_LABELS) as ReportDomain[];

export interface AppliedQuery {
  domain: ReportDomain;
  filter: UniversalReportFilter;
}

// ── Facet visibility ──────────────────────────────────────────────────────────
/** Which filter facets are shown for a given report domain. */
export interface FacetVisibility {
  showBarangays: boolean;
  showCategories: boolean;
  showStatuses: boolean;
  showAgeVessel: boolean;
  showVesselTypes: boolean;
  showProgram: boolean;
  showGearType: boolean;
  showDateRange: boolean;
}

/**
 * Derive the per-domain facet visibility. Pure — extracted verbatim from the
 * ReportHub component body so the branching logic is unit-testable in isolation.
 */
export function getFacetVisibility(domain: ReportDomain): FacetVisibility {
  return {
    showBarangays: domain !== "violation" && domain !== "ayuda",
    showCategories: domain === "fisherfolk",
    showStatuses:
      domain === "fisherfolk" ||
      domain === "vessel" ||
      domain === "violation" ||
      domain === "ayuda",
    showAgeVessel: domain === "fisherfolk",
    showVesselTypes: domain === "fisherfolk" || domain === "vessel",
    showProgram: domain === "ayuda",
    showGearType: domain === "fish-catch",
    showDateRange:
      domain === "violation" || domain === "ayuda" || domain === "fish-catch",
  };
}
