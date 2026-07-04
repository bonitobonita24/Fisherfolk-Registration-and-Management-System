"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageOff, FileX2, Users, UserCheck, Ship, AlertTriangle, UserCog, FileClock } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { StatCard } from "@/components/shared";
import { BarangayDensityMap } from "./barangay-density-map";

// ── Skeleton shimmer ──────────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

// ── Chart configs ─────────────────────────────────────────────────────────────
// --chart-N tokens are HSL triplets ("217 71% 53%") — consume via hsl().
const CATEGORY_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const barangayConfig = {
  count: { label: "Fisherfolk", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const ageConfig = {
  count: { label: "Fisherfolk", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const genderConfig = {
  value: { label: "Count" },
  Male: { label: "Male", color: "hsl(var(--chart-1))" },
  Female: { label: "Female", color: "hsl(var(--chart-2))" },
  Unspecified: { label: "Unspecified", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const categoryConfig = {
  count: { label: "Fisherfolk" },
} satisfies ChartConfig;

const catByBgyConfig = {
  count: { label: "Fisherfolk", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

// ── Main client component ─────────────────────────────────────────────────────
export function DashboardClient() {
  const params = useParams();
  const tenantSlug = params.tenant as string;

  const [bgyFilter, setBgyFilter] = useState<string>("all");

  const { data: stats, isLoading: statsLoading } =
    trpc.dashboard.getStats.useQuery();
  const { data: barangayData, isLoading: barangayLoading } =
    trpc.dashboard.getFisherfolkByBarangay.useQuery();
  const { data: demo, isLoading: demoLoading } =
    trpc.dashboard.getDemographics.useQuery();
  const { data: ageGroups, isLoading: ageLoading } =
    trpc.dashboard.getAgeGroups.useQuery();
  const { data: catByBgy, isLoading: catByBgyLoading } =
    trpc.dashboard.getCategoryByBarangay.useQuery({
      barangay: bgyFilter,
    });

  // ── KPI section ────────────────────────────────────────────────────────────
  const kpis = [
    { title: "Total Fisherfolk", value: stats?.totalFisherfolk, icon: Users },
    { title: "Active Fisherfolk", value: stats?.activeFisherfolk, icon: UserCheck },
    { title: "Vessels", value: stats?.totalVessels, icon: Ship },
    { title: "Active Violations", value: stats?.activeViolations, icon: AlertTriangle },
    { title: "Users", value: stats?.totalUsers, icon: UserCog },
    { title: "Pending Edit Requests", value: stats?.pendingEditRequests, icon: FileClock },
  ];

  // ── Derived chart data ───────────────────────────────────────────────────────
  const top15Barangay = barangayData?.slice(0, 15) ?? [];
  const barangayOptions = barangayData ?? [];

  const genderData =
    demo != null
      ? [
          { name: "Male", value: demo.sex.male, fill: "var(--color-Male)" },
          {
            name: "Female",
            value: demo.sex.female,
            fill: "var(--color-Female)",
          },
          ...(demo.sex.unspecified > 0
            ? [
                {
                  name: "Unspecified",
                  value: demo.sex.unspecified,
                  fill: "var(--color-Unspecified)",
                },
              ]
            : []),
        ]
      : [];
  const genderTotal = genderData.reduce((sum, d) => sum + d.value, 0);

  const categories = demo?.categories ?? [];

  return (
    <div className="space-y-8">
      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <StatCard
                key={kpi.title}
                icon={<Icon className="size-5" />}
                value={(kpi.value ?? 0).toLocaleString()}
                title={kpi.title}
                loading={statsLoading}
              />
            );
          })}
        </div>
      </section>

      {/* ── Barangay Density Map ─────────────────────────────────────────────  */}
      <BarangayDensityMap />

      {/* ── Barangay (bar) + Gender (donut) ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fisherfolk by Barangay */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Fisherfolk Distribution by Barangay
            </CardTitle>
            <CardDescription>Registered fisherfolk per barangay</CardDescription>
          </CardHeader>
          <CardContent>
            {barangayLoading ? (
              <Shimmer className="h-[320px] w-full" />
            ) : top15Barangay.length === 0 ? (
              <EmptyState message="No barangay data yet." />
            ) : (
              <ChartContainer
                config={barangayConfig}
                className="aspect-auto h-[320px] w-full"
              >
                <BarChart
                  data={top15Barangay}
                  margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="barangay"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tickLine={false} axisLine={false} width={32} />
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

        {/* Gender Distribution (donut) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gender Distribution</CardTitle>
            <CardDescription>Breakdown by sex</CardDescription>
          </CardHeader>
          <CardContent>
            {demoLoading ? (
              <Shimmer className="h-[320px] w-full" />
            ) : genderTotal === 0 ? (
              <EmptyState message="No gender data yet." />
            ) : (
              <ChartContainer
                config={genderConfig}
                className="mx-auto aspect-square h-[320px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    strokeWidth={4}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (
                          viewBox &&
                          "cx" in viewBox &&
                          "cy" in viewBox &&
                          typeof viewBox.cx === "number" &&
                          typeof viewBox.cy === "number"
                        ) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {genderTotal.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy + 22}
                                className="fill-muted-foreground text-xs"
                              >
                                Total
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Age Groups (bar) + Category (horizontal bar) ───────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Age Group Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Age Group Distribution</CardTitle>
            <CardDescription>Distribution by age bracket</CardDescription>
          </CardHeader>
          <CardContent>
            {ageLoading ? (
              <Shimmer className="h-[320px] w-full" />
            ) : (ageGroups?.length ?? 0) === 0 ? (
              <EmptyState message="No age data yet." />
            ) : (
              <ChartContainer
                config={ageConfig}
                className="aspect-auto h-[320px] w-full"
              >
                <BarChart
                  data={ageGroups ?? []}
                  margin={{ top: 16, right: 8, bottom: 8, left: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="group"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="count"
                      position="top"
                      className="fill-muted-foreground text-xs"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Activity Category Distribution (horizontal) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Activity Category Distribution
            </CardTitle>
            <CardDescription>Fisherfolk per primary activity</CardDescription>
          </CardHeader>
          <CardContent>
            {demoLoading ? (
              <Shimmer className="h-[320px] w-full" />
            ) : categories.length === 0 ? (
              <EmptyState message="No categories configured." />
            ) : (
              <ChartContainer
                config={categoryConfig}
                className="aspect-auto h-[320px] w-full"
              >
                <BarChart
                  layout="vertical"
                  data={categories}
                  margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {categories.map((cat, i) => (
                      <Cell
                        key={cat.name}
                        fill={
                          CATEGORY_COLORS[i % CATEGORY_COLORS.length] ??
                          "hsl(var(--chart-1))"
                        }
                      />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="right"
                      className="fill-muted-foreground text-xs"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Activity Category by Barangay (filtered bar) ───────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">
              Activity Category by Barangay
            </CardTitle>
            <CardDescription>Activity mix for the selected barangay</CardDescription>
          </div>
          <Select value={bgyFilter} onValueChange={setBgyFilter}>
            <SelectTrigger className="w-[200px]" aria-label="Filter by barangay">
              <SelectValue placeholder="All Barangays" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Barangays</SelectItem>
              {barangayOptions.map((b) => (
                <SelectItem key={b.barangay} value={b.barangay}>
                  {b.barangay}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {catByBgyLoading ? (
            <Shimmer className="h-[300px] w-full" />
          ) : (catByBgy?.length ?? 0) === 0 ? (
            <EmptyState message="No category data for this barangay." />
          ) : (
            <ChartContainer
              config={catByBgyConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart
                data={catByBgy ?? []}
                margin={{ top: 16, right: 8, bottom: 8, left: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(catByBgy ?? []).map((row, i) => (
                    <Cell
                      key={row.category}
                      fill={
                        CATEGORY_COLORS[i % CATEGORY_COLORS.length] ??
                        "hsl(var(--chart-1))"
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
                    className="fill-muted-foreground text-xs"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Status Breakdown ───────────────────────────────────────────────── */}
      {!demoLoading && (demo?.status?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registration Status</CardTitle>
            <CardDescription>Records by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-0 sm:grid-cols-3 md:grid-cols-5">
              {demo?.status.map((s) => (
                <div key={s.status} className="py-2 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {s.count.toLocaleString()}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {s.status}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Data Completeness ──────────────────────────────────────────────── */}
      <section aria-label="Data completeness">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Data Completeness
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href={`/${tenantSlug}/fisherfolk?missing=photo`}>
            <StatCard icon={<ImageOff className="size-5" />} value={(stats?.missingPhoto ?? 0).toLocaleString()} title="Missing Photo" loading={statsLoading} className="cursor-pointer transition-colors hover:border-primary/50" />
          </Link>
          <Link href={`/${tenantSlug}/fisherfolk?missing=signature`}>
            <StatCard icon={<FileX2 className="size-5" />} value={(stats?.missingSignature ?? 0).toLocaleString()} title="Missing Signature" loading={statsLoading} className="cursor-pointer transition-colors hover:border-primary/50" />
          </Link>
        </div>
      </section>
    </div>
  );
}
