"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/shared";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import type { RegistrationType } from "./registration-type-select";

const categoryChartConfig = {
  count: { label: "Fisherfolk", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const yoyChartConfig = {
  newCount: { label: "New", color: "hsl(var(--chart-1))" },
  renewedCount: { label: "Renewed", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

/** Small "+12% vs 2025" pill for the YoY delta. */
function DeltaBadge({
  deltaPercent,
  priorYear,
}: {
  deltaPercent: number;
  priorYear: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium tabular-nums",
        deltaPercent > 0
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          : deltaPercent < 0
            ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
            : "bg-muted text-muted-foreground",
      )}
    >
      {deltaPercent > 0 ? "+" : ""}
      {deltaPercent}% vs {priorYear}
    </span>
  );
}

const FISHERFOLK_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

interface FisherfolkGroupTileProps {
  activeFisherfolk: number;
  newFisherfolk: number;
  renewedFisherfolk: number;
  statsLoading: boolean;
  year: number;
  registrationType: RegistrationType;
}

export function FisherfolkGroupTile({
  activeFisherfolk,
  newFisherfolk,
  renewedFisherfolk,
  statsLoading,
  year,
  registrationType,
}: FisherfolkGroupTileProps) {
  const headline = activeFisherfolk + newFisherfolk + renewedFisherfolk;
  // Display-only: all this-year registrations (active + new) are shown as NEW.
  const displayedNewFisherfolk = activeFisherfolk + newFisherfolk;

  const { data: categoryBreakdown, isLoading: catLoading } =
    trpc.dashboard.getFisherfolkCategoryBreakdown.useQuery({
      registrationType,
      year,
    });

  const { data: yoy, isLoading: yoyLoading } =
    trpc.dashboard.getYoYComparison.useQuery();

  // Last ~4 years, oldest → newest; latest row carries the delta badge.
  const yoySeries = (yoy ?? []).slice(-4);
  const yoyLatest = yoySeries.length > 0 ? yoySeries[yoySeries.length - 1] : undefined;

  return (
    <Card className="flex flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="space-y-1 border-b px-6 py-5">
        <CardTitle className="text-sm font-medium">Fisherfolk</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-64 flex-1 flex-col space-y-2 px-6 py-5">
        {/* Big headline: ACTIVE + NEW + RENEWED (D1 decision) */}
        {statsLoading ? (
          <Shimmer className="h-8 w-20" />
        ) : (
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold leading-none text-foreground">
              {headline.toLocaleString()}
            </p>
            {/* NEW · RENEWED fraction from getStats */}
            <p className="text-xs text-muted-foreground">
              {displayedNewFisherfolk.toLocaleString()} NEW &middot;{" "}
              {renewedFisherfolk.toLocaleString()} RENEWED
            </p>
          </div>
        )}
        {/* Year-over-year comparison — new + renewed per year, delta vs prior */}
        {yoyLoading ? (
          <Shimmer className="h-[96px] w-full" />
        ) : yoySeries.length < 2 ? (
          <EmptyState
            title="Not enough data for a year-over-year comparison"
            description="At least two years of registrations are needed."
            className="gap-1 px-4 py-4 [&>h2]:text-xs [&>p]:text-xs"
          />
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Year over year
              </p>
              {yoyLatest?.deltaPercent != null && (
                <DeltaBadge
                  deltaPercent={yoyLatest.deltaPercent}
                  priorYear={yoyLatest.year - 1}
                />
              )}
            </div>
            <ChartContainer
              config={yoyChartConfig}
              className="aspect-auto h-[96px] w-full"
            >
              <AreaChart
                data={yoySeries}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tick={{ fontSize: 9 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="newCount"
                  stroke="var(--color-newCount)"
                  fill="var(--color-newCount)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="renewedCount"
                  stroke="var(--color-renewedCount)"
                  fill="var(--color-renewedCount)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
        {/* Category breakdown chart (registrationType-filtered) */}
        {catLoading ? (
          <Shimmer className="h-[180px] w-full" />
        ) : (categoryBreakdown?.length ?? 0) === 0 ? (
          <p className="flex h-[180px] items-center justify-center text-xs text-muted-foreground">
            No category data yet.
          </p>
        ) : (
          <ChartContainer
            config={categoryChartConfig}
            className="aspect-auto h-[180px] w-full"
          >
            <BarChart
              data={categoryBreakdown ?? []}
              margin={{ top: 12, right: 4, bottom: 40, left: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                tick={{ fontSize: 9 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={24}
                tick={{ fontSize: 9 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {(categoryBreakdown ?? []).map((row, i) => (
                  <Cell
                    key={row.category}
                    fill={
                      FISHERFOLK_COLORS[i % FISHERFOLK_COLORS.length] ??
                      "hsl(var(--chart-1))"
                    }
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="top"
                  className="fill-muted-foreground"
                  style={{ fontSize: 9 }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
