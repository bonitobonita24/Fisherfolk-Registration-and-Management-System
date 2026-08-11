import { describe, expect, it } from "vitest";

import type { ReportDomain } from "@frms/shared/schemas";
import {
  DOMAINS,
  getFacetVisibility,
  type FacetVisibility,
} from "../report-hub-config";

/**
 * Characterization test — pins the per-domain facet visibility exactly as it
 * behaved inline in ReportHub before the V32 CGC-driven decomposition.
 */
describe("getFacetVisibility", () => {
  const expected: Record<ReportDomain, FacetVisibility> = {
    fisherfolk: {
      showBarangays: true,
      showCategories: true,
      showStatuses: true,
      showAgeVessel: true,
      showVesselTypes: true,
      showProgram: false,
      showGearType: false,
      showDateRange: false,
    },
    household: {
      showBarangays: true,
      showCategories: false,
      showStatuses: false,
      showAgeVessel: false,
      showVesselTypes: false,
      showProgram: false,
      showGearType: false,
      showDateRange: false,
    },
    vessel: {
      showBarangays: true,
      showCategories: false,
      showStatuses: true,
      showAgeVessel: false,
      showVesselTypes: true,
      showProgram: false,
      showGearType: false,
      showDateRange: false,
    },
    violation: {
      showBarangays: false,
      showCategories: false,
      showStatuses: true,
      showAgeVessel: false,
      showVesselTypes: false,
      showProgram: false,
      showGearType: false,
      showDateRange: true,
    },
    ayuda: {
      showBarangays: false,
      showCategories: false,
      showStatuses: true,
      showAgeVessel: false,
      showVesselTypes: false,
      showProgram: true,
      showGearType: false,
      showDateRange: true,
    },
    "fish-catch": {
      showBarangays: true,
      showCategories: false,
      showStatuses: false,
      showAgeVessel: false,
      showVesselTypes: false,
      showProgram: false,
      showGearType: true,
      showDateRange: true,
    },
  };

  it.each(DOMAINS)("returns the expected visibility for %s", (domain) => {
    expect(getFacetVisibility(domain)).toEqual(expected[domain]);
  });

  it("covers every domain", () => {
    expect(DOMAINS).toHaveLength(Object.keys(expected).length);
  });
});
