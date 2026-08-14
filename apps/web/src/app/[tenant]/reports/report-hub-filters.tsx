"use client";

import type { inferRouterOutputs } from "@trpc/server";
import type { ReportDomain } from "@frms/shared/schemas";

import type { AppRouter } from "@/server/trpc/root";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DOMAIN_LABELS,
  DOMAINS,
  type FacetVisibility,
} from "./report-hub-config";

type DomainFacets = inferRouterOutputs<AppRouter>["report"]["getDomainFacets"];

// ── Faceted checkbox group ──────────────────────────────────────────────────
function FacetCheckboxGroup({
  legend,
  options,
  selected,
  onChange,
}: {
  legend: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const idBase = `hub-facet-${legend.toLowerCase().replace(/\s+/g, "-")}`;

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  }

  return (
    <fieldset className="space-y-1.5 rounded-md border border-border p-3">
      <legend className="px-1 text-sm font-medium">{legend}</legend>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">No options available.</p>
      ) : (
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {options.map((opt) => {
            const checkboxId = `${idBase}-${opt}`;
            return (
              <Label
                key={opt}
                htmlFor={checkboxId}
                className="flex min-h-6 cursor-pointer items-center gap-2 py-1 font-normal"
              >
                <Checkbox
                  id={checkboxId}
                  checked={selected.includes(opt)}
                  onCheckedChange={() => toggle(opt)}
                />
                {opt}
              </Label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

export interface ReportFiltersProps {
  domain: ReportDomain;
  onDomainChange: (next: ReportDomain) => void;

  barangays: string[];
  setBarangays: (next: string[]) => void;
  categoryIds: string[];
  setCategoryIds: (next: string[]) => void;
  statuses: string[];
  setStatuses: (next: string[]) => void;
  vesselTypes: string[];
  setVesselTypes: (next: string[]) => void;
  vesselOwner: "any" | "yes" | "no";
  setVesselOwner: (next: "any" | "yes" | "no") => void;
  ageMin: string;
  setAgeMin: (next: string) => void;
  ageMax: string;
  setAgeMax: (next: string) => void;
  programId: string;
  setProgramId: (next: string) => void;
  gearType: string;
  setGearType: (next: string) => void;
  dateFrom: string;
  setDateFrom: (next: string) => void;
  dateTo: string;
  setDateTo: (next: string) => void;

  facets: DomainFacets | undefined;
  visibility: FacetVisibility;

  hasApplied: boolean;
  canExport: boolean;
  exporting: boolean;
  onGenerate: () => void;
  onExport: () => void;
}

/**
 * Filters card for the Report Hub — presentational. Renders the domain
 * selector, per-domain facet controls, and the action buttons. Extracted
 * verbatim from the ReportHub component body (no behavior change).
 */
export function ReportFilters({
  domain,
  onDomainChange,
  barangays,
  setBarangays,
  categoryIds,
  setCategoryIds,
  statuses,
  setStatuses,
  vesselTypes,
  setVesselTypes,
  vesselOwner,
  setVesselOwner,
  ageMin,
  setAgeMin,
  ageMax,
  setAgeMax,
  programId,
  setProgramId,
  gearType,
  setGearType,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  facets,
  visibility,
  hasApplied,
  canExport,
  exporting,
  onGenerate,
  onExport,
}: ReportFiltersProps) {
  const {
    showBarangays,
    showCategories,
    showStatuses,
    showAgeVessel,
    showVesselTypes,
    showProgram,
    showGearType,
    showDateRange,
  } = visibility;

  return (
    <Card className="overflow-hidden py-0 print:hidden">
      <CardHeader className="border-b px-6 py-5">
        <CardTitle className="text-sm font-medium">Report Hub — Faceted Query</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-5">
        <div className="space-y-1.5">
          <Label htmlFor="hub-domain">Domain</Label>
          <Select
            value={domain}
            onValueChange={(v) => onDomainChange(v as ReportDomain)}
          >
            <SelectTrigger id="hub-domain" className="h-9 w-full sm:w-72">
              <SelectValue placeholder="Select domain…" />
            </SelectTrigger>
            <SelectContent className="w-56">
              {DOMAINS.map((d) => (
                <SelectItem key={d} value={d}>
                  {DOMAIN_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {showBarangays && (
            <FacetCheckboxGroup
              legend={domain === "fish-catch" ? "Fishing Ground" : domain === "vessel" ? "Homeport Barangay" : "Barangay"}
              options={facets?.barangays ?? []}
              selected={barangays}
              onChange={setBarangays}
            />
          )}
          {showCategories && (
            <FacetCheckboxGroup
              legend="Category"
              options={(facets?.categories ?? []).map((c) => c.name)}
              selected={categoryIds}
              onChange={(names) =>
                setCategoryIds(
                  (facets?.categories ?? [])
                    .filter((c) => names.includes(c.name))
                    .map((c) => c.id),
                )
              }
            />
          )}
          {showStatuses && (
            <FacetCheckboxGroup
              legend="Status"
              options={facets?.statuses ?? []}
              selected={statuses}
              onChange={setStatuses}
            />
          )}
          {showVesselTypes && (
            <FacetCheckboxGroup
              legend="Vessel Type"
              options={facets?.vesselTypes ?? []}
              selected={vesselTypes}
              onChange={setVesselTypes}
            />
          )}

          {showAgeVessel && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="hub-age-min">Min age</Label>
                <Input
                  id="hub-age-min"
                  type="number"
                  min={0}
                  max={150}
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  placeholder="Any"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hub-age-max">Max age</Label>
                <Input
                  id="hub-age-max"
                  type="number"
                  min={0}
                  max={150}
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  placeholder="Any"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hub-vessel-owner">Vessel owner</Label>
                <Select
                  value={vesselOwner}
                  onValueChange={(v) => setVesselOwner(v as "any" | "yes" | "no")}
                >
                  <SelectTrigger id="hub-vessel-owner" className="h-9">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent className="w-52">
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="yes">Owner</SelectItem>
                    <SelectItem value="no">Non-owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {showProgram && (
            <div className="space-y-1.5">
              <Label htmlFor="hub-program">Program</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger id="hub-program" className="h-9">
                  <SelectValue placeholder="Any program" />
                </SelectTrigger>
                <SelectContent className="w-60">
                  <SelectItem value="any">Any program</SelectItem>
                  {(facets?.programs ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showGearType && (
            <div className="space-y-1.5">
              <Label htmlFor="hub-gear-type">Gear type</Label>
              <Select value={gearType} onValueChange={setGearType}>
                <SelectTrigger id="hub-gear-type" className="h-9">
                  <SelectValue placeholder="Any gear type" />
                </SelectTrigger>
                <SelectContent className="w-52">
                  <SelectItem value="any">Any gear type</SelectItem>
                  {(facets?.gearTypes ?? []).map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showDateRange && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="hub-date-from">Date From</Label>
                <Input
                  id="hub-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hub-date-to">Date To</Label>
                <Input
                  id="hub-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={onGenerate}>Generate Report</Button>
          {hasApplied && (
            <>
              <Button variant="outline" onClick={() => window.print()}>
                Print / PDF
              </Button>
              {canExport && (
                <Button
                  variant="outline"
                  onClick={onExport}
                  disabled={exporting}
                >
                  {exporting ? "Exporting…" : "Export Excel"}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
