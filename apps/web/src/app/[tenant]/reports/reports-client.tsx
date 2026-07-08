"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { trpc } from "@/lib/trpc/client";

// ── Types ─────────────────────────────────────────────────────────────────────
type ReportType =
  | "member_list"
  | "new_registrations"
  | "renewed"
  | "inactive"
  | "senior_citizens"
  | "voter_eligible"
  | "violations"
  | "vessels"
  | "family_clusters"
  | "households";

interface ReportFilters {
  barangay?: string;
  year?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface AppliedQuery {
  type: ReportType;
  filters: ReportFilters;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const REPORT_LABELS: Record<ReportType, string> = {
  member_list: "Member List",
  new_registrations: "New Registrations",
  renewed: "Renewed Members",
  inactive: "Inactive Members",
  senior_citizens: "Senior Citizens",
  voter_eligible: "Voter-Eligible",
  violations: "Violation Report",
  vessels: "Vessel Inventory",
  family_clusters: "Family Clusters",
  households: "Household Masterlist",
};

const REPORT_TYPES = Object.keys(REPORT_LABELS) as ReportType[];

// ── Shimmer ───────────────────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ReportsClient() {
  const { data: me } = trpc.user.me.useQuery();

  const [reportType, setReportType] = useState<ReportType>("member_list");
  const [barangay, setBarangay] = useState("");
  const [year, setYear] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [applied, setApplied] = useState<AppliedQuery | null>(null);

  const canExport = me?.role === "admin" || me?.role === "super_admin";

  // ── Report query (only fires after Generate) ───────────────────────────────
  const { data: report, isLoading: reportLoading } =
    trpc.report.getReport.useQuery(
      {
        type: applied?.type ?? "member_list",
        filters: applied?.filters ?? {},
      },
      { enabled: applied !== null }
    );

  // ── Export query (manual trigger only) ────────────────────────────────────
  const exportExcel = trpc.report.exportExcel.useQuery(
    {
      type: applied?.type ?? "member_list",
      filters: applied?.filters ?? {},
    },
    { enabled: false }
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleGenerate() {
    const filters: ReportFilters = {};
    if (barangay.trim()) filters.barangay = barangay.trim();
    if (year.trim()) filters.year = parseInt(year, 10);
    if (dateFrom.trim()) filters.dateFrom = dateFrom;
    if (dateTo.trim()) filters.dateTo = dateTo;
    setApplied({ type: reportType, filters });
  }

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
        err instanceof Error ? err.message : "Export failed. Please try again."
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
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Report Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report type */}
          <div className="space-y-1.5">
            <Label htmlFor="report-type">Report Type</Label>
            <Select
              value={reportType}
              onValueChange={(v) => setReportType(v as ReportType)}
            >
              <SelectTrigger id="report-type" className="w-full sm:w-72">
                <SelectValue placeholder="Select report…" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((rt) => (
                  <SelectItem key={rt} value={rt}>
                    {REPORT_LABELS[rt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="filter-barangay">Barangay</Label>
              <Input
                id="filter-barangay"
                placeholder="e.g. Bucayao"
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-year">Year</Label>
              <Input
                id="filter-year"
                type="number"
                placeholder="e.g. 2024"
                min={2000}
                max={2099}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-date-from">Date From</Label>
              <Input
                id="filter-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-date-to">Date To</Label>
              <Input
                id="filter-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleGenerate}>Generate</Button>
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
                  {report?.title ?? REPORT_LABELS[applied.type]}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {report?.count !== undefined && (
                    <span>
                      {report.count.toLocaleString()}{" "}
                      {report.count === 1 ? "record" : "records"}
                      {report.generatedAt ? " · " : ""}
                    </span>
                  )}
                  {report?.generatedAt && (
                    <span>Generated {report.generatedAt}</span>
                  )}
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
                            {row[col.key] !== undefined
                              ? String(row[col.key])
                              : "—"}
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
    </div>
  );
}
