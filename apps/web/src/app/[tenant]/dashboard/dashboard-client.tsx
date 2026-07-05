"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
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
import { ImageOff, FileX2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { StatCard } from "@/components/shared";
import { BarangayDensityMap } from "./barangay-density-map";
import type { RegistrationType } from "./registration-type-select";
import { FisherfolkGroupTile } from "./fisherfolk-group-tile";
import { VesselGroupTile } from "./vessel-group-tile";
import { ViolationsGroupTile } from "./violations-group-tile";

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
// Wrapped in Suspense because the inner component reads useSearchParams()
// (year/registration-type filters are now driven by the header — see header.tsx).
export function DashboardClient() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClientInner />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Shimmer className="h-64 w-full" />
      <Shimmer className="h-48 w-full" />
    </div>
  );
}

function DashboardClientInner() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const searchParams = useSearchParams();

  const [bgyFilter, setBgyFilter] = useState<string>("all");

  const parsedYear = Number(searchParams.get("year"));
  const year =
    Number.isFinite(parsedYear) && parsedYear > 0
      ? parsedYear
      : new Date().getFullYear();
  const rawReg = searchParams.get("reg");
  const registrationType: RegistrationType =
    rawReg === "NEW" || rawReg === "RENEWED" ? rawReg : "ALL";

  const { data: stats, isLoading: statsLoading } =
    trpc.dashboard.getStats.useQuery({ year });
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

  return (
    <div className="space-y-4">
      {/* ── Density Map (~75%) + Side Column (25%) ───────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <BarangayDensityMap />
        </div>
        <div className="flex flex-col gap-3">
          <FisherfolkGroupTile
            activeFisherfolk={stats?.activeFisherfolk ?? 0}
            newFisherfolk={stats?.newFisherfolk ?? 0}
            renewedFisherfolk={stats?.renewedFisherfolk ?? 0}
            statsLoading={statsLoading}
            year={year}
            registrationType={registrationType}
          />
          <VesselGroupTile />
          <ViolationsGroupTile
            activeViolations={stats?.activeViolations ?? 0}
            loading={statsLoading}
          />
        </div>
      </div>

      {/* ── TILE B: Demographics — Gender + Age + Barangay ─────────────────── */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">Demographics</CardTitle>
          <CardDescription className="text-xs">Gender, age group, and barangay breakdown</CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Gender Distribution */}
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Gender</p>
              {demoLoading ? (
                <Shimmer className="h-[200px] w-full" />
              ) : genderTotal === 0 ? (
                <EmptyState message="No gender data yet." />
              ) : (
                <ChartContainer
                  config={genderConfig}
                  className="mx-auto aspect-square h-[200px]"
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
                      innerRadius={50}
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
            </div>
            {/* Age Group Distribution */}
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Age Groups</p>
              {ageLoading ? (
                <Shimmer className="h-[200px] w-full" />
              ) : (ageGroups?.length ?? 0) === 0 ? (
                <EmptyState message="No age data yet." />
              ) : (
                <ChartContainer config={ageConfig} className="aspect-auto h-[200px] w-full">
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
            </div>
            {/* Barangay Distribution */}
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">By barangay (top 15)</p>
              {barangayLoading ? (
                <Shimmer className="h-[200px] w-full" />
              ) : top15Barangay.length === 0 ? (
                <EmptyState message="No barangay data yet." />
              ) : (
                <ChartContainer config={barangayConfig} className="aspect-auto h-[200px] w-full">
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
                      tick={{ fontSize: 9 }}
                    />
                    <YAxis tickLine={false} axisLine={false} width={28} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── TILE C: Activity Categories ──────────────────────────────────── */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">Activity Categories</CardTitle>
          <CardDescription className="text-xs">Category distribution and by-barangay breakdown</CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Activity Category Distribution */}
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Overall distribution</p>
              {demoLoading ? (
                <Shimmer className="h-[200px] w-full" />
              ) : categories.length === 0 ? (
                <EmptyState message="No categories configured." />
              ) : (
                <ChartContainer config={categoryConfig} className="aspect-auto h-[200px] w-full">
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
            </div>
            {/* Activity Category by Barangay */}
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <p id="cat-by-bgy-heading" className="text-xs font-medium text-muted-foreground">By barangay</p>
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
              </div>
              {catByBgyLoading ? (
                <Shimmer className="h-[200px] w-full" />
              ) : (catByBgy?.length ?? 0) === 0 ? (
                <EmptyState message="No category data for this barangay." />
              ) : (
                <ChartContainer config={catByBgyConfig} className="aspect-auto h-[200px] w-full" role="figure" aria-labelledby="cat-by-bgy-heading">
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
            </div>
          </div>
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
