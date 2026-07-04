"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { trpc } from "@/lib/trpc/client";
import type { RegistrationType } from "./registration-type-select";

const categoryChartConfig = {
  count: { label: "Fisherfolk", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

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

  const { data: categoryBreakdown, isLoading: catLoading } =
    trpc.dashboard.getFisherfolkCategoryBreakdown.useQuery({
      registrationType,
      year,
    });

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">Fisherfolk</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {/* Big headline: ACTIVE + NEW + RENEWED (D1 decision) */}
        {statsLoading ? (
          <Shimmer className="h-8 w-20" />
        ) : (
          <p className="text-3xl font-bold leading-none text-foreground">
            {headline.toLocaleString()}
          </p>
        )}
        {/* NEW · RENEWED fraction from getStats */}
        {!statsLoading && (
          <p className="text-xs text-muted-foreground">
            {newFisherfolk.toLocaleString()} NEW &middot;{" "}
            {renewedFisherfolk.toLocaleString()} RENEWED
          </p>
        )}
        {/* vs last year — PLACEHOLDER only, never fabricated */}
        {!statsLoading && (
          <p className="text-xs text-muted-foreground italic">
            Year-over-year comparison coming soon
          </p>
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
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[3, 3, 0, 0]}
              >
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
