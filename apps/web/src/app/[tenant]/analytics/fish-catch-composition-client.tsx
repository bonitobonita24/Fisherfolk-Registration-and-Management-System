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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catch by Species (Top 10)</CardTitle>
          <CardDescription>Total landed weight by common name</CardDescription>
        </CardHeader>
        <CardContent>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="commonName"
                  tickLine={false}
                  axisLine={false}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tickLine={false} axisLine={false} width={56} />
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catch by Gear Type</CardTitle>
          <CardDescription>Total landed weight by fishing gear</CardDescription>
        </CardHeader>
        <CardContent>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="gearTypeLabel"
                  tickLine={false}
                  axisLine={false}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tickLine={false} axisLine={false} width={56} />
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Catch per Unit Effort by Gear (kg/hr)
          </CardTitle>
          <CardDescription>Landed weight per fishing hour, by gear</CardDescription>
        </CardHeader>
        <CardContent>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="gearTypeLabel"
                  tickLine={false}
                  axisLine={false}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tickLine={false} axisLine={false} width={56} />
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Catch by Fishing-Ground Barangay
          </CardTitle>
          <CardDescription>Top 15 barangays by landed weight</CardDescription>
        </CardHeader>
        <CardContent>
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
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="barangay"
                  width={130}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Fisherfolk by Catch</CardTitle>
          <CardDescription>Top 10 fisherfolk by total landed weight</CardDescription>
        </CardHeader>
        <CardContent>
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
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Vessels by Catch</CardTitle>
          <CardDescription>Top 10 vessels by total landed weight</CardDescription>
        </CardHeader>
        <CardContent>
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
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
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
