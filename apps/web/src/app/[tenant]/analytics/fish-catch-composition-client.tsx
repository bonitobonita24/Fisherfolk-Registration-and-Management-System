"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { GEAR_TYPE_LABELS } from "@frms/shared/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
const gridProps = { strokeDasharray: "3 3", stroke: "hsl(var(--border))" } as const;
const tickProps = {
  tick: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
} as const;

// ── Static chart configs ──────────────────────────────────────────────────────
const speciesConfig = {
  totalKg: { label: "Catch (kg)", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const gearTypeConfig = {
  totalKg: { label: "Catch (kg)", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const cpueConfig = {
  cpueHr: { label: "CPUE (kg/hr)", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const barangayConfig = {
  totalKg: { label: "Catch (kg)", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const topFishersConfig = {
  totalKg: { label: "Catch (kg)", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const topVesselsConfig = {
  totalKg: { label: "Catch (kg)", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

// ── Main client component ─────────────────────────────────────────────────────
export function FishCatchCompositionClient() {
  const { data: bySpecies, isLoading: bySpeciesLoading } =
    trpc.fishCatchAnalytics.bySpecies.useQuery({});
  const { data: byGearType, isLoading: byGearTypeLoading } =
    trpc.fishCatchAnalytics.byGearType.useQuery({});
  const { data: byBarangay, isLoading: byBarangayLoading } =
    trpc.fishCatchAnalytics.byBarangay.useQuery({});
  const { data: topFishers, isLoading: topFishersLoading } =
    trpc.fishCatchAnalytics.topFishers.useQuery({});
  const { data: topVessels, isLoading: topVesselsLoading } =
    trpc.fishCatchAnalytics.topVessels.useQuery({});

  // Derived data
  const gearTypeData = (byGearType ?? []).map((g) => ({
    ...g,
    gearTypeLabel: GEAR_TYPE_LABELS[g.gearType] ?? g.gearType,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ── Catch by Species ──────────────────────────────────────────────── */}
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="text-sm font-medium">Catch by Species (Top 10)</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Total landed weight by common name
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {bySpeciesLoading ? (
            <Shimmer className="h-[300px] w-full" />
          ) : (bySpecies?.length ?? 0) === 0 ? (
            <EmptyState message="No fish catch species data yet." />
          ) : (
            <ChartContainer
              config={speciesConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart
                data={bySpecies ?? []}
                margin={{ left: -10, right: 10, top: 5, bottom: 48 }}
              >
                <CartesianGrid {...gridProps} vertical={false} />
                <XAxis
                  dataKey="commonName"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  {...tickProps}
                />
                <YAxis {...tickProps} width={56} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="totalKg"
                  fill="var(--color-totalKg)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Catch by Gear Type ────────────────────────────────────────────── */}
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="text-sm font-medium">Catch by Gear Type</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Total landed weight by fishing gear
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {byGearTypeLoading ? (
            <Shimmer className="h-[300px] w-full" />
          ) : gearTypeData.length === 0 ? (
            <EmptyState message="No gear type data yet." />
          ) : (
            <ChartContainer
              config={gearTypeConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart
                data={gearTypeData}
                margin={{ left: -10, right: 10, top: 5, bottom: 48 }}
              >
                <CartesianGrid {...gridProps} vertical={false} />
                <XAxis
                  dataKey="gearTypeLabel"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  {...tickProps}
                />
                <YAxis {...tickProps} width={56} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="totalKg"
                  fill="var(--color-totalKg)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ── CPUE by Gear Type ─────────────────────────────────────────────── */}
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="text-sm font-medium">
            Catch per Unit Effort by Gear (kg/hr)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Landed weight per fishing hour, by gear
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {byGearTypeLoading ? (
            <Shimmer className="h-[300px] w-full" />
          ) : gearTypeData.length === 0 ? (
            <EmptyState message="No gear type data yet." />
          ) : (
            <ChartContainer
              config={cpueConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart
                data={gearTypeData}
                margin={{ left: -10, right: 10, top: 5, bottom: 48 }}
              >
                <CartesianGrid {...gridProps} vertical={false} />
                <XAxis
                  dataKey="gearTypeLabel"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  {...tickProps}
                />
                <YAxis {...tickProps} width={56} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="cpueHr"
                  fill="var(--color-cpueHr)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Catch by Fishing-Ground Barangay ──────────────────────────────── */}
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="text-sm font-medium">
            Catch by Fishing-Ground Barangay
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Top 15 barangays by landed weight
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {byBarangayLoading ? (
            <Shimmer className="h-[300px] w-full" />
          ) : (byBarangay?.length ?? 0) === 0 ? (
            <EmptyState message="No fishing-ground barangay data yet." />
          ) : (
            <ChartContainer
              config={barangayConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart
                data={byBarangay ?? []}
                layout="vertical"
                margin={{ left: 0, right: 24, top: 5, bottom: 5 }}
              >
                <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" {...tickProps} />
                <YAxis
                  type="category"
                  dataKey="barangay"
                  width={130}
                  {...tickProps}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="totalKg"
                  fill="var(--color-totalKg)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Top Fisherfolk by Catch ───────────────────────────────────────── */}
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="text-sm font-medium">Top Fisherfolk by Catch</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Top 10 fisherfolk by total landed weight
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {topFishersLoading ? (
            <Shimmer className="h-[300px] w-full" />
          ) : (topFishers?.length ?? 0) === 0 ? (
            <EmptyState message="No fish catch records yet." />
          ) : (
            <ChartContainer
              config={topFishersConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart
                data={topFishers ?? []}
                layout="vertical"
                margin={{ left: 0, right: 24, top: 5, bottom: 5 }}
              >
                <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" {...tickProps} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  {...tickProps}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="totalKg"
                  fill="var(--color-totalKg)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Top Vessels by Catch ──────────────────────────────────────────── */}
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="text-sm font-medium">Top Vessels by Catch</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Top 10 vessels by total landed weight
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {topVesselsLoading ? (
            <Shimmer className="h-[300px] w-full" />
          ) : (topVessels?.length ?? 0) === 0 ? (
            <EmptyState message="No fish catch records yet." />
          ) : (
            <ChartContainer
              config={topVesselsConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart
                data={topVessels ?? []}
                layout="vertical"
                margin={{ left: 0, right: 24, top: 5, bottom: 5 }}
              >
                <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" {...tickProps} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  {...tickProps}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="totalKg"
                  fill="var(--color-totalKg)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
