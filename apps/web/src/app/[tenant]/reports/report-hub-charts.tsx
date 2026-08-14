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

// ── Shared Recharts tick/grid props ──────────────────────────────────────────
const tickProps = {
  tick: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
} as const;

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
          <Card key={i} className="overflow-hidden py-0">
            <CardHeader className="border-b px-6 py-5">
              <CardTitle className="text-sm font-medium">
                <Shimmer className="h-4 w-40" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
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
        <Card className="overflow-hidden py-0">
          <CardContent className="px-6 py-5">
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
          <Card key={chart.key} className="overflow-hidden py-0">
            <CardHeader className="border-b px-6 py-5">
              <CardTitle className="text-sm font-medium">{chart.title}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
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
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                      {...tickProps}
                    />
                    <YAxis {...tickProps} width={56} />
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
