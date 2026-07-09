"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import type { ReportDomain, UniversalReportFilter } from "@frms/shared/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { trpc } from "@/lib/trpc/client";

// ── Shimmer ───────────────────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

// ── Chart color cycle ─────────────────────────────────────────────────────────
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

function buildChartConfig(): ChartConfig {
  return {
    value: { label: "Value", color: CHART_COLORS[0] },
  } satisfies ChartConfig;
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export function ReportHubCharts({
  domain,
  filter,
  enabled,
}: {
  domain: ReportDomain;
  filter: UniversalReportFilter;
  enabled: boolean;
}) {
  const { data, isLoading } = trpc.report.getDomainChartData.useQuery(
    { domain, filter },
    { enabled },
  );

  if (!enabled) {
    return (
      <div className="print:hidden">
        <p className="flex h-[120px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          Generate a report to see charts.
        </p>
      </div>
    );
  }

  const charts = data?.charts ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:hidden">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-base">
                <Shimmer className="h-4 w-40" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Shimmer className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (charts.length === 0 || charts.every((c) => c.data.length === 0)) {
    return (
      <div className="print:hidden">
        <Card>
          <CardContent className="pt-6">
            <EmptyState message="No chart data available for this report." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:hidden">
      {charts.map((chart) => {
        const chartConfig = buildChartConfig();
        return (
          <Card key={chart.key}>
            <CardHeader>
              <CardTitle className="text-base">{chart.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {chart.data.length === 0 ? (
                <EmptyState message="No data for this chart." />
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[300px] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={chart.data}
                    margin={{ left: -10, right: 10, top: 5, bottom: 48 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tickLine={false} axisLine={false} width={56} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chart.data.map((entry, i) => (
                        <Cell
                          key={entry.label}
                          fill={CHART_COLORS[i % CHART_COLORS.length] ?? CHART_COLORS[0]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
