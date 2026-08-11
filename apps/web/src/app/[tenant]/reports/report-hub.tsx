"use client";

import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import type { ReportDomain, UniversalReportFilter } from "@frms/shared/schemas";

import { getFacetVisibility, type AppliedQuery } from "./report-hub-config";
import { ReportFilters } from "./report-hub-filters";
import { ReportResults } from "./report-hub-results";
import { ReportHubCharts } from "./report-hub-charts";

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
      <ReportFilters
        domain={domain}
        onDomainChange={handleDomainChange}
        barangays={barangays}
        setBarangays={setBarangays}
        categoryIds={categoryIds}
        setCategoryIds={setCategoryIds}
        statuses={statuses}
        setStatuses={setStatuses}
        vesselTypes={vesselTypes}
        setVesselTypes={setVesselTypes}
        vesselOwner={vesselOwner}
        setVesselOwner={setVesselOwner}
        ageMin={ageMin}
        setAgeMin={setAgeMin}
        ageMax={ageMax}
        setAgeMax={setAgeMax}
        programId={programId}
        setProgramId={setProgramId}
        gearType={gearType}
        setGearType={setGearType}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        facets={facetsQuery.data}
        visibility={getFacetVisibility(domain)}
        hasApplied={applied !== null}
        canExport={canExport}
        exporting={exportExcel.isFetching}
        onGenerate={handleGenerate}
        onExport={() => void handleExport()}
      />

      {/* ── Results card ───────────────────────────────────────────────────── */}
      {applied !== null && (
        <ReportResults
          report={report}
          reportLoading={reportLoading}
          appliedDomain={applied.domain}
        />
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
