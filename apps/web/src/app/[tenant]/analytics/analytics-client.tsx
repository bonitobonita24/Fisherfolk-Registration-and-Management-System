"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

// ── Static chart configs ──────────────────────────────────────────────────────
const trendsConfig = {
  count: { label: "Registrations", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const agePyramidConfig = {
  male: { label: "Male", color: "hsl(var(--chart-1))" },
  female: { label: "Female", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const voterConfig = {
  value: { label: "Count" },
  eligible: { label: "Eligible", color: "hsl(var(--chart-2))" },
  notEligible: { label: "Not Eligible", color: "hsl(var(--chart-5))" },
  unknown: { label: "Unknown", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const barangayConfig = {
  count: { label: "Fisherfolk", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const seniorsConfig = {
  count: { label: "Seniors", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const violationsConfig = {
  count: { label: "Violations", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const categoriesConfig = {
  count: { label: "Count", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

// ── Main client component ─────────────────────────────────────────────────────
export function AnalyticsClient() {
  const { data: trends, isLoading: trendsLoading } =
    trpc.analytics.getRegistrationTrends.useQuery();
  const { data: voterData, isLoading: voterLoading } =
    trpc.analytics.getVoterAnalysis.useQuery();
  const { data: seniors, isLoading: seniorsLoading } =
    trpc.analytics.getSeniorsByBarangay.useQuery();
  const { data: violations, isLoading: violationsLoading } =
    trpc.analytics.getViolationHotspots.useQuery();
  const { data: agePyramid, isLoading: agePyramidLoading } =
    trpc.analytics.getAgePyramid.useQuery();
  const { data: barangayData, isLoading: barangayLoading } =
    trpc.dashboard.getFisherfolkByBarangay.useQuery();
  const { data: demo, isLoading: demoLoading } =
    trpc.dashboard.getDemographics.useQuery();

  // Derived data
  const top12Barangay = barangayData?.slice(0, 12) ?? [];
  const top15Seniors = seniors?.slice(0, 15) ?? [];
  const top15Violations = violations?.slice(0, 15) ?? [];
  const categories = demo?.categories ?? [];

  const voterChartData = voterData
    ? [
        { name: "eligible", value: voterData.eligible },
        { name: "notEligible", value: voterData.notEligible },
        { name: "unknown", value: voterData.unknown },
      ]
    : [];
  const voterTotal = voterData
    ? voterData.eligible + voterData.notEligible + voterData.unknown
    : 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ── Registration Trends ───────────────────────────────────────────── */}
      <FormSection
        title="Registration Trends"
        description="Annual new fisherfolk registrations"
        className="overflow-hidden py-0"
      >
        {trendsLoading ? (
          <Shimmer className="h-[300px] w-full" />
        ) : (trends?.length ?? 0) === 0 ? (
          <EmptyState message="No registration data yet." />
        ) : (
          <ChartContainer
            config={trendsConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart
              data={trends ?? []}
              margin={{ left: -10, right: 10, top: 5, bottom: 5 }}
            >
              <CartesianGrid {...gridProps} vertical={false} />
              <XAxis dataKey="year" {...tickProps} />
              <YAxis {...tickProps} width={56} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-count)"
                fill="var(--color-count)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </FormSection>

      {/* ── Age Pyramid ───────────────────────────────────────────────────── */}
      <FormSection
        title="Age Pyramid"
        description="Distribution by age bucket and sex"
        className="overflow-hidden py-0"
      >
        {agePyramidLoading ? (
          <Shimmer className="h-[300px] w-full" />
        ) : (agePyramid?.length ?? 0) === 0 ? (
          <EmptyState message="No age data available." />
        ) : (
          <ChartContainer
            config={agePyramidConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <BarChart
              data={agePyramid ?? []}
              margin={{ left: -10, right: 10, top: 5, bottom: 5 }}
            >
              <CartesianGrid {...gridProps} vertical={false} />
              <XAxis dataKey="bucket" {...tickProps} />
              <YAxis {...tickProps} width={56} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="male"
                fill="var(--color-male)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="female"
                fill="var(--color-female)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </FormSection>

      {/* ── Voter Eligibility ─────────────────────────────────────────────── */}
      <FormSection
        title="Voter Eligibility"
        description="COMELEC registration status"
        className="overflow-hidden py-0"
      >
        {voterLoading ? (
          <Shimmer className="h-[300px] w-full" />
        ) : voterTotal === 0 ? (
          <EmptyState message="No voter eligibility data available." />
        ) : (
          <ChartContainer
            config={voterConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent nameKey="name" hideLabel />
                }
              />
              <Pie
                data={voterChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={105}
              >
                <Cell fill="var(--color-eligible)" />
                <Cell fill="var(--color-notEligible)" />
                <Cell fill="var(--color-unknown)" />
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        )}
      </FormSection>

      {/* ── Registered by Barangay ────────────────────────────────────────── */}
      <FormSection
        title="Registered by Barangay"
        description="Top 12 barangays by count"
        className="overflow-hidden py-0"
      >
        {barangayLoading ? (
          <Shimmer className="h-[300px] w-full" />
        ) : top12Barangay.length === 0 ? (
          <EmptyState message="No barangay data yet." />
        ) : (
          <ChartContainer
            config={barangayConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <BarChart
              data={top12Barangay}
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
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </FormSection>

      {/* ── Senior Citizens by Barangay ───────────────────────────────────── */}
      <FormSection
        title="Senior Citizens by Barangay"
        description="Top 15 barangays, age 60+"
        className="overflow-hidden py-0"
      >
        {seniorsLoading ? (
          <Shimmer className="h-[300px] w-full" />
        ) : top15Seniors.length === 0 ? (
          <EmptyState message="No senior citizen data available." />
        ) : (
          <ChartContainer
            config={seniorsConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <BarChart
              data={top15Seniors}
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
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </FormSection>

      {/* ── Violation Hotspots ────────────────────────────────────────────── */}
      <FormSection
        title="Violation Hotspots"
        description="Top 15 barangays by violations"
        className="overflow-hidden py-0"
      >
        {violationsLoading ? (
          <Shimmer className="h-[300px] w-full" />
        ) : top15Violations.length === 0 ? (
          <EmptyState message="No violation records found." />
        ) : (
          <ChartContainer
            config={violationsConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <BarChart
              data={top15Violations}
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
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </FormSection>

      {/* ── Category Distribution ─────────────────────────────────────────── */}
      <FormSection
        title="Category Distribution"
        description="Fisherfolk count per activity category"
        className="overflow-hidden py-0 lg:col-span-2"
      >
        {demoLoading ? (
          <Shimmer className="h-[300px] w-full" />
        ) : categories.length === 0 ? (
          <EmptyState message="No category data configured." />
        ) : (
          <ChartContainer
            config={categoriesConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <BarChart
              data={categories}
              margin={{ left: -10, right: 10, top: 5, bottom: 48 }}
            >
              <CartesianGrid {...gridProps} vertical={false} />
              <XAxis
                dataKey="name"
                angle={-30}
                textAnchor="end"
                interval={0}
                {...tickProps}
              />
              <YAxis {...tickProps} width={56} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </FormSection>
    </div>
  );
}
