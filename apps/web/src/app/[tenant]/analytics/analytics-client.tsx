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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registration Trends</CardTitle>
          <CardDescription>Annual new fisherfolk registrations</CardDescription>
        </CardHeader>
        <CardContent>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
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
        </CardContent>
      </Card>

      {/* ── Age Pyramid ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Age Pyramid</CardTitle>
          <CardDescription>Distribution by age bucket and sex</CardDescription>
        </CardHeader>
        <CardContent>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
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
        </CardContent>
      </Card>

      {/* ── Voter Eligibility ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voter Eligibility</CardTitle>
          <CardDescription>COMELEC registration status</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* ── Registered by Barangay ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registered by Barangay</CardTitle>
          <CardDescription>Top 12 barangays by count</CardDescription>
        </CardHeader>
        <CardContent>
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
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Senior Citizens by Barangay ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Senior Citizens by Barangay
          </CardTitle>
          <CardDescription>Top 15 barangays, age 60+</CardDescription>
        </CardHeader>
        <CardContent>
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
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Violation Hotspots ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Violation Hotspots</CardTitle>
          <CardDescription>Top 15 barangays by violations</CardDescription>
        </CardHeader>
        <CardContent>
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
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Category Distribution ─────────────────────────────────────────── */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Category Distribution</CardTitle>
          <CardDescription>Fisherfolk count per activity category</CardDescription>
        </CardHeader>
        <CardContent>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
