"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { FormSection } from "@/components/shared/form-section";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
const gridProps = { strokeDasharray: "3 3", stroke: "hsl(var(--border))" } as const;
const tickProps = {
  tick: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
} as const;

// ── Formatters ───────────────────────────────────────────────────────────────
function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

// ── Static chart configs ──────────────────────────────────────────────────────
const totalKgConfig = {
  totalKg: { label: "Total Catch (kg)", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const valuePhpConfig = {
  valuePhp: { label: "Catch Value (₱)", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const cpueConfig = {
  cpueHr: { label: "CPUE (kg/hr)", color: "hsl(var(--chart-3))" },
  cpueTrip: { label: "CPUE (kg/trip)", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

// ── Main client component ─────────────────────────────────────────────────────
export function FishCatchTrendsClient() {
  const { data: trends, isLoading: trendsLoading } =
    trpc.fishCatchAnalytics.catchTrends.useQuery({});

  const data = trends ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ── Total Catch (kg) over time ────────────────────────────────────── */}
      <FormSection
        title="Total Catch (kg) over time"
        description="Monthly total landed catch weight"
        className="overflow-hidden py-0"
      >
        {trendsLoading ? (
          <Shimmer className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <EmptyState message="No fish catch data yet." />
        ) : (
          <ChartContainer
            config={totalKgConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart
              data={data}
              margin={{ left: -10, right: 10, top: 5, bottom: 5 }}
            >
              <CartesianGrid {...gridProps} vertical={false} />
              <XAxis dataKey="month" {...tickProps} />
              <YAxis
                {...tickProps}
                width={56}
                tickFormatter={formatCompactNumber}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="totalKg"
                stroke="var(--color-totalKg)"
                fill="var(--color-totalKg)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </FormSection>

      {/* ── Catch Value (₱) over time ─────────────────────────────────────── */}
      <FormSection
        title="Catch Value (₱) over time"
        description="Monthly estimated catch value"
        className="overflow-hidden py-0"
      >
        {trendsLoading ? (
          <Shimmer className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <EmptyState message="No fish catch value data yet." />
        ) : (
          <ChartContainer
            config={valuePhpConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart
              data={data}
              margin={{ left: -10, right: 10, top: 5, bottom: 5 }}
            >
              <CartesianGrid {...gridProps} vertical={false} />
              <XAxis dataKey="month" {...tickProps} />
              <YAxis
                {...tickProps}
                width={56}
                tickFormatter={formatCompactNumber}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="valuePhp"
                stroke="var(--color-valuePhp)"
                fill="var(--color-valuePhp)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </FormSection>

      {/* ── CPUE Trend ───────────────────────────────────────────────────── */}
      <FormSection
        title="CPUE Trend"
        description="Catch per unit effort — kg per fishing hour and kg per trip"
        className="overflow-hidden py-0 lg:col-span-2"
      >
        {trendsLoading ? (
          <Shimmer className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <EmptyState message="No CPUE data yet." />
        ) : (
          <ChartContainer
            config={cpueConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <LineChart
              data={data}
              margin={{ left: -10, right: 10, top: 5, bottom: 5 }}
            >
              <CartesianGrid {...gridProps} vertical={false} />
              <XAxis dataKey="month" {...tickProps} />
              <YAxis
                {...tickProps}
                width={56}
                tickFormatter={formatCompactNumber}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="cpueHr"
                stroke="var(--color-cpueHr)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cpueTrip"
                stroke="var(--color-cpueTrip)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </FormSection>
    </div>
  );
}
