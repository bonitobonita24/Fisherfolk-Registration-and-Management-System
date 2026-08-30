"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { GEAR_TYPE_LABELS } from "@frms/shared/constants";
import { FormSection } from "@/components/shared/form-section";
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
      <FormSection
        title="Catch by Species (Top 10)"
        description="Total landed weight by common name"
        className="overflow-hidden py-0"
      >
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
      </FormSection>

      {/* ── Catch by Gear Type ────────────────────────────────────────────── */}
      <FormSection
        title="Catch by Gear Type"
        description="Total landed weight by fishing gear"
        className="overflow-hidden py-0"
      >
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
      </FormSection>

      {/* ── CPUE by Gear Type ─────────────────────────────────────────────── */}
      <FormSection
        title="Catch per Unit Effort by Gear (kg/hr)"
        description="Landed weight per fishing hour, by gear"
        className="overflow-hidden py-0"
      >
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
      </FormSection>

      {/* ── Catch by Fishing-Ground Barangay ──────────────────────────────── */}
      <FormSection
        title="Catch by Fishing-Ground Barangay"
        description="Top 15 barangays by landed weight"
        className="overflow-hidden py-0"
      >
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
      </FormSection>

      {/* ── Top Fisherfolk by Catch ───────────────────────────────────────── */}
      <FormSection
        title="Top Fisherfolk by Catch"
        description="Top 10 fisherfolk by total landed weight"
        className="overflow-hidden py-0"
      >
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
      </FormSection>

      {/* ── Top Vessels by Catch ──────────────────────────────────────────── */}
      <FormSection
        title="Top Vessels by Catch"
        description="Top 10 vessels by total landed weight"
        className="overflow-hidden py-0"
      >
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
      </FormSection>
    </div>
  );
}
