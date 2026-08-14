"use client";

import type { inferRouterOutputs } from "@trpc/server";
import type { ReportDomain } from "@frms/shared/schemas";

import type { AppRouter } from "@/server/trpc/root";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DOMAIN_LABELS } from "./report-hub-config";

type ReportData = inferRouterOutputs<AppRouter>["report"]["getDomainReport"];

// ── Shimmer ───────────────────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

/**
 * Results card for the Report Hub — presentational. Renders the loading
 * skeleton, empty state, or the generated report table. Extracted verbatim
 * from the ReportHub component body (no behavior change).
 */
export function ReportResults({
  report,
  reportLoading,
  appliedDomain,
}: {
  report: ReportData | undefined;
  reportLoading: boolean;
  appliedDomain: ReportDomain;
}) {
  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="border-b px-6 py-5">
        {reportLoading ? (
          <div className="space-y-2">
            <Shimmer className="h-5 w-48" />
            <Shimmer className="h-4 w-32" />
          </div>
        ) : (
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">
              {report?.title ?? DOMAIN_LABELS[appliedDomain]}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {report?.count !== undefined && (
                <span className="tabular-nums">
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
      <CardContent className="px-6 py-5">
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
                    <TableHead
                      key={col.key}
                      className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0"
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map((row, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {report.columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className="border-r px-3 py-2 text-sm last:border-r-0"
                      >
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
  );
}
