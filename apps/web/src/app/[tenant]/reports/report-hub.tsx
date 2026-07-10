"use client";

import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import type { ReportDomain, UniversalReportFilter } from "@frms/shared/schemas";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportHubCharts } from "./report-hub-charts";

// ── Constants ─────────────────────────────────────────────────────────────────
const DOMAIN_LABELS: Record<ReportDomain, string> = {
  fisherfolk: "Fisherfolk",
  household: "Household",
  vessel: "Vessel",
  violation: "Violation",
  ayuda: "Ayuda",
  "fish-catch": "Fish Catch",
};

const DOMAINS = Object.keys(DOMAIN_LABELS) as ReportDomain[];

interface AppliedQuery {
  domain: ReportDomain;
  filter: UniversalReportFilter;
}

// ── Shimmer ───────────────────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

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

// ── Main component ────────────────────────────────────────────────────────────
export function ReportHub() {
  const { data: me } = trpc.user.me.useQuery();
  const canExport =
    me?.role === "tenant_superadmin" ||
    me?.role === "tenant_manager" ||
    me?.role === "tenant_admin";

  const [domain, setDomain] = useState<ReportDomain>("fisherfolk");
  const [barangays, setBarangays] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [vesselOwner, setVesselOwner] = useState<"any" | "yes" | "no">("any");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [programId, setProgramId] = useState<string>("any");
  const [gearType, setGearType] = useState<string>("any");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [applied, setApplied] = useState<AppliedQuery | null>(null);

  const facetsQuery = trpc.report.getDomainFacets.useQuery({ domain });

  function buildFilter(): UniversalReportFilter {
    const f: UniversalReportFilter = {};
    if (barangays.length > 0) f.barangays = barangays;
    if (categoryIds.length > 0) f.categoryIds = categoryIds;
    if (statuses.length > 0) f.statuses = statuses;
    if (vesselTypes.length > 0) f.vesselTypes = vesselTypes;
    if (vesselOwner !== "any") f.vesselOwner = vesselOwner;
    const min = Number.parseInt(ageMin, 10);
    if (!Number.isNaN(min)) f.ageMin = min;
    const max = Number.parseInt(ageMax, 10);
    if (!Number.isNaN(max)) f.ageMax = max;
    if (programId !== "any") f.programId = programId;
    if (gearType !== "any") f.gearType = gearType;
    if (dateFrom.trim()) f.dateFrom = dateFrom;
    if (dateTo.trim()) f.dateTo = dateTo;
    return f;
  }

  function handleDomainChange(next: ReportDomain) {
    setDomain(next);
    setBarangays([]);
    setCategoryIds([]);
    setStatuses([]);
    setVesselTypes([]);
    setVesselOwner("any");
    setAgeMin("");
    setAgeMax("");
    setProgramId("any");
    setGearType("any");
    setDateFrom("");
    setDateTo("");
    setApplied(null);
  }

  function handleGenerate() {
    setApplied({ domain, filter: buildFilter() });
  }

  const { data: report, isLoading: reportLoading } =
    trpc.report.getDomainReport.useQuery(
      { domain: applied?.domain ?? domain, filter: applied?.filter ?? {} },
      { enabled: applied !== null },
    );

  const exportExcel = trpc.report.exportDomainExcel.useQuery(
    { domain: applied?.domain ?? domain, filter: applied?.filter ?? {} },
    { enabled: false },
  );

  async function handleExport() {
    try {
      const result = await exportExcel.refetch();
      if (!result.data) throw new Error("No data returned from export.");
      const { filename, base64 } = result.data;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Export failed. Please try again.",
      );
    }
  }

  const facets = facetsQuery.data;
  const showBarangays = domain !== "violation" && domain !== "ayuda";
  const showCategories = domain === "fisherfolk";
  const showStatuses =
    domain === "fisherfolk" || domain === "vessel" || domain === "violation" || domain === "ayuda";
  const showAgeVessel = domain === "fisherfolk";
  const showVesselTypes = domain === "fisherfolk" || domain === "vessel";
  const showProgram = domain === "ayuda";
  const showGearType = domain === "fish-catch";
  const showDateRange = domain === "violation" || domain === "ayuda" || domain === "fish-catch";

  return (
    <div className="space-y-6">
      {/* ── Print-only government header ──────────────────────────────────── */}
      <div className="hidden print:block mb-6 text-center space-y-0.5">
        <p className="text-sm font-semibold">Republic of the Philippines</p>
        <p className="text-sm font-semibold">City Government of Calapan</p>
        <p className="text-sm font-semibold">Fisheries Management Office</p>
        {report?.title && (
          <p className="mt-2 text-base font-bold uppercase tracking-wide">
            {report.title}
          </p>
        )}
      </div>

      {/* ── Filters card (hidden on print) ────────────────────────────────── */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Report Hub — Faceted Query</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hub-domain">Domain</Label>
            <Select
              value={domain}
              onValueChange={(v) => handleDomainChange(v as ReportDomain)}
            >
              <SelectTrigger id="hub-domain" className="w-full sm:w-72">
                <SelectValue placeholder="Select domain…" />
              </SelectTrigger>
              <SelectContent>
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
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hub-vessel-owner">Vessel owner</Label>
                  <Select
                    value={vesselOwner}
                    onValueChange={(v) => setVesselOwner(v as "any" | "yes" | "no")}
                  >
                    <SelectTrigger id="hub-vessel-owner">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <SelectTrigger id="hub-program">
                    <SelectValue placeholder="Any program" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <SelectTrigger id="hub-gear-type">
                    <SelectValue placeholder="Any gear type" />
                  </SelectTrigger>
                  <SelectContent>
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
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hub-date-to">Date To</Label>
                  <Input
                    id="hub-date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleGenerate}>Generate Report</Button>
            {applied !== null && (
              <>
                <Button variant="outline" onClick={() => window.print()}>
                  Print / PDF
                </Button>
                {canExport && (
                  <Button
                    variant="outline"
                    onClick={() => void handleExport()}
                    disabled={exportExcel.isFetching}
                  >
                    {exportExcel.isFetching ? "Exporting…" : "Export Excel"}
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Results card ───────────────────────────────────────────────────── */}
      {applied !== null && (
        <Card>
          <CardHeader className="pb-3">
            {reportLoading ? (
              <div className="space-y-2">
                <Shimmer className="h-5 w-48" />
                <Shimmer className="h-4 w-32" />
              </div>
            ) : (
              <div className="space-y-1">
                <CardTitle className="text-base">
                  {report?.title ?? DOMAIN_LABELS[applied.domain]}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {report?.count !== undefined && (
                    <span>
                      {report.count.toLocaleString()}{" "}
                      {report.count === 1 ? "record" : "records"}
                      {report.generatedAt ? " · " : ""}
                    </span>
                  )}
                  {report?.generatedAt && <span>Generated {report.generatedAt}</span>}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {reportLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Shimmer key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !report || report.count === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No records found for the selected filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {report.columns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.rows.map((row, rowIdx) => (
                      <TableRow key={rowIdx}>
                        {report.columns.map((col) => (
                          <TableCell key={col.key}>
                            {row[col.key] !== undefined ? String(row[col.key]) : "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {applied !== null && (
        <ReportHubCharts
          domain={applied.domain}
          filter={applied.filter}
          enabled={applied !== null}
        />
      )}
    </div>
  );
}
