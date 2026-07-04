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
import {
  ImageOff,
  FileX2,
  Users,
  UserCheck,
  Ship,
  AlertTriangle,
  UserCog,
  FileClock,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { StatCard } from "@/components/shared";
import { BarangayDensityMap } from "./barangay-density-map";
import { KpiCard } from "./kpi-card";

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
    <p className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
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
    trpc.dashboard.getCategoryByBarangay.useQuery({ barangay: bgyFilter });

  // ── Derived data ────────────────────────────────────────────────────────────
  const top15Barangay = barangayData?.slice(0, 15) ?? [];
  const top5Barangay = barangayData?.slice(0, 5) ?? [];
  const barangayOptions = barangayData ?? [];

  const genderData =
    demo != null
      ? [
          { name: "Male", value: demo.sex.male, fill: "var(--color-Male)" },
          { name: "Female", value: demo.sex.female, fill: "var(--color-Female)" },
          ...(demo.sex.unspecified > 0
            ? [{ name: "Unspecified", value: demo.sex.unspecified, fill: "var(--color-Unspecified)" }]
            : []),
        ]
      : [];
  const genderTotal = genderData.reduce((sum, d) => sum + d.value, 0);
  const categories = demo?.categories ?? [];

  // ── Mini sparklines ─────────────────────────────────────────────────────────
  const miniMax = Math.max(...top5Barangay.map((d) => d.count), 1);
  const totalSpark =
    top5Barangay.length > 0 && top5Barangay.some((d) => d.count > 0) ? (
      <div className="flex h-8 items-end gap-px" aria-hidden="true">
        {top5Barangay.map((d) => (
          <div
            key={d.barangay}
            className="flex-1 rounded-t-[1px] opacity-70"
            style={{
              height: `${Math.round((d.count / miniMax) * 100)}%`,
              backgroundColor: "hsl(var(--chart-1))",
            }}
          />
        ))}
      </div>
    ) : undefined;

  const activeRatio =
    stats != null
      ? Math.min(
          100,
          Math.round(
            ((stats.activeFisherfolk ?? 0) / Math.max(stats.totalFisherfolk ?? 1, 1)) * 100
          )
        )
      : 0;
  const activeSpark =
    stats != null ? (
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className="h-full rounded-full"
          style={{
            width: `${activeRatio}%`,
            backgroundColor: "hsl(var(--chart-2))",
          }}
        />
      </div>
    ) : undefined;

  // ── KPI strip config ────────────────────────────────────────────────────────
  const kpis = [
    { title: "Total Fisherfolk", value: stats?.totalFisherfolk ?? 0, Icon: Users, sparkline: totalSpark },
    { title: "Active Fisherfolk", value: stats?.activeFisherfolk ?? 0, Icon: UserCheck, sparkline: activeSpark },
    { title: "Vessels", value: stats?.totalVessels ?? 0, Icon: Ship },
    { title: "Active Violations", value: stats?.activeViolations ?? 0, Icon: AlertTriangle },
    { title: "New", value: stats?.newFisherfolk ?? 0, Icon: UserCog },
    { title: "Renewed", value: stats?.renewedFisherfolk ?? 0, Icon: FileClock },
  ] as const;

  return (
    <div className="space-y-4">
      {/* ── KPI Strip — 6 across ──────────────────────────────────────────── */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              Icon={kpi.Icon}
              loading={statsLoading}
              sparkline={"sparkline" in kpi ? kpi.sparkline : undefined}
            />
          ))}
        </div>
      </section>

      {/* ── Density Map (2/3) + Status Breakdown (1/3) ───────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BarangayDensityMap />
        </div>
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Registration Status</CardTitle>
            <CardDescription className="text-xs">Records by status</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {demoLoading ? (
              <div className="space-y-2">
                <Shimmer className="h-12 w-full" />
                <Shimmer className="h-12 w-full" />
                <Shimmer className="h-12 w-full" />
              </div>
            ) : (demo?.status?.length ?? 0) === 0 ? (
              <p className="text-xs text-muted-foreground">No status data yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {demo?.status.map((s) => (
                  <div
                    key={s.status}
                    className="rounded-md bg-muted/40 px-2 py-2 text-center"
                  >
                    <p className="text-xl font-bold text-foreground">
                      {s.count.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {s.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Barangay (bar) + Gender (donut) ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Fisherfolk by Barangay */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Distribution by Barangay</CardTitle>
            <CardDescription className="text-xs">Top 15 barangays by count</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {barangayLoading ? (
              <Shimmer className="h-[220px] w-full" />
            ) : top15Barangay.length === 0 ? (
              <EmptyState message="No barangay data yet." />
            ) : (
              <ChartContainer config={barangayConfig} className="aspect-auto h-[220px] w-full">
                <BarChart
                  data={top15Barangay}
                  margin={{ top: 4, right: 4, bottom: 4, left: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="barangay"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tickLine={false} axisLine={false} width={28} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Gender Distribution</CardTitle>
            <CardDescription className="text-xs">Breakdown by sex</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {demoLoading ? (
              <Shimmer className="h-[220px] w-full" />
            ) : genderTotal === 0 ? (
              <EmptyState message="No gender data yet." />
            ) : (
              <ChartContainer
                config={genderConfig}
                className="mx-auto aspect-square h-[220px]"
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
                    innerRadius={55}
                    strokeWidth={3}
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
                                className="fill-foreground text-2xl font-bold"
                              >
                                {genderTotal.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy + 18}
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

      {/* ── Age Groups (bar) + Category (horizontal bar) ─────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Age Group Distribution */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Age Group Distribution</CardTitle>
            <CardDescription className="text-xs">Distribution by age bracket</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {ageLoading ? (
              <Shimmer className="h-[220px] w-full" />
            ) : (ageGroups?.length ?? 0) === 0 ? (
              <EmptyState message="No age data yet." />
            ) : (
              <ChartContainer config={ageConfig} className="aspect-auto h-[220px] w-full">
                <BarChart
                  data={ageGroups ?? []}
                  margin={{ top: 12, right: 4, bottom: 4, left: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="group"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tickLine={false} axisLine={false} width={28} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]}>
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

        {/* Activity Category Distribution */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Activity Category Distribution</CardTitle>
            <CardDescription className="text-xs">Fisherfolk per primary activity</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {demoLoading ? (
              <Shimmer className="h-[220px] w-full" />
            ) : categories.length === 0 ? (
              <EmptyState message="No categories configured." />
            ) : (
              <ChartContainer config={categoryConfig} className="aspect-auto h-[220px] w-full">
                <BarChart
                  layout="vertical"
                  data={categories}
                  margin={{ top: 4, right: 28, bottom: 4, left: 4 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                    {categories.map((cat, i) => (
                      <Cell
                        key={cat.name}
                        fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length] ?? "hsl(var(--chart-1))"}
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

      {/* ── Activity Category by Barangay ────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 p-3 pb-2">
          <div>
            <CardTitle className="text-sm">Activity Category by Barangay</CardTitle>
            <CardDescription className="text-xs">Activity mix for selected barangay</CardDescription>
          </div>
          <Select value={bgyFilter} onValueChange={setBgyFilter}>
            <SelectTrigger className="h-7 w-[160px] text-xs" aria-label="Filter by barangay">
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
        <CardContent className="p-3 pt-0">
          {catByBgyLoading ? (
            <Shimmer className="h-[200px] w-full" />
          ) : (catByBgy?.length ?? 0) === 0 ? (
            <EmptyState message="No category data for this barangay." />
          ) : (
            <ChartContainer config={catByBgyConfig} className="aspect-auto h-[200px] w-full">
              <BarChart
                data={catByBgy ?? []}
                margin={{ top: 12, right: 4, bottom: 4, left: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tickLine={false} axisLine={false} width={28} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {(catByBgy ?? []).map((row, i) => (
                    <Cell
                      key={row.category}
                      fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length] ?? "hsl(var(--chart-1))"}
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

      {/* ── Data Completeness ─────────────────────────────────────────────── */}
      <section aria-label="Data completeness">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Data Completeness</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href={`/${tenantSlug}/fisherfolk?missing=photo`}>
            <StatCard
              icon={<ImageOff className="size-5" />}
              value={(stats?.missingPhoto ?? 0).toLocaleString()}
              title="Missing Photo"
              loading={statsLoading}
              className="cursor-pointer transition-colors hover:border-primary/50"
            />
          </Link>
          <Link href={`/${tenantSlug}/fisherfolk?missing=signature`}>
            <StatCard
              icon={<FileX2 className="size-5" />}
              value={(stats?.missingSignature ?? 0).toLocaleString()}
              title="Missing Signature"
              loading={statsLoading}
              className="cursor-pointer transition-colors hover:border-primary/50"
            />
          </Link>
        </div>
      </section>
    </div>
  );
}
