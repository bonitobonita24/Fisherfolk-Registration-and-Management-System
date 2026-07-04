"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
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

const VESSEL_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const vesselChartConfig = {
  count: { label: "Vessels" },
} satisfies ChartConfig;

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export function VesselGroupTile() {
  const { data: vesselBreakdown, isLoading } =
    trpc.dashboard.getVesselCategoryBreakdown.useQuery();

  const totalVessels = (vesselBreakdown ?? []).reduce(
    (sum, d) => sum + d.count,
    0,
  );

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">Vessels</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {isLoading ? (
          <Shimmer className="h-8 w-16" />
        ) : (
          <p className="text-3xl font-bold leading-none text-foreground">
            {totalVessels.toLocaleString()}
          </p>
        )}
        {isLoading ? (
          <Shimmer className="h-[140px] w-full" />
        ) : (vesselBreakdown?.length ?? 0) === 0 ? (
          <p className="flex h-[140px] items-center justify-center text-xs text-muted-foreground">
            No vessel data yet.
          </p>
        ) : (
          <ChartContainer
            config={vesselChartConfig}
            className="aspect-auto h-[140px] w-full"
          >
            <BarChart
              data={vesselBreakdown ?? []}
              margin={{ top: 12, right: 4, bottom: 40, left: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="vesselType"
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
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {(vesselBreakdown ?? []).map((row, i) => (
                  <Cell
                    key={row.vesselType}
                    fill={
                      VESSEL_COLORS[i % VESSEL_COLORS.length] ??
                      "hsl(var(--chart-1))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
