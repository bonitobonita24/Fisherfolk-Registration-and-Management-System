"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageOff, FileX2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

// ── Skeleton shimmer ──────────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

// ── CSS bar helpers ───────────────────────────────────────────────────────────
function CssBar({
  label,
  count,
  max,
  colorClass = "bg-primary",
}: {
  label: string;
  count: number;
  max: number;
  colorClass?: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate text-foreground" title={label}>
          {label}
        </span>
        <span className="ml-2 shrink-0 font-medium tabular-nums text-muted-foreground">
          {count.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

function StatRow({
  label,
  count,
  colorClass = "bg-primary",
}: {
  label: string;
  count: number;
  colorClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorClass}`} />
        <span className="text-foreground">{label}</span>
      </div>
      <span className="font-medium tabular-nums text-muted-foreground">
        {count.toLocaleString()}
      </span>
    </div>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Shimmer className="h-8 w-24" />
        ) : (
          <p className="text-3xl font-bold text-foreground">
            {(value ?? 0).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main client component ─────────────────────────────────────────────────────
export function DashboardClient() {
  const params = useParams();
  const tenantSlug = params.tenant as string;

  const { data: stats, isLoading: statsLoading } =
    trpc.dashboard.getStats.useQuery();

  const { data: barangayData, isLoading: barangayLoading } =
    trpc.dashboard.getFisherfolkByBarangay.useQuery();

  const { data: demo, isLoading: demoLoading } =
    trpc.dashboard.getDemographics.useQuery();

  // ── KPI section ────────────────────────────────────────────────────────────
  const kpis = [
    { title: "Total Fisherfolk", value: stats?.totalFisherfolk },
    { title: "Active Fisherfolk", value: stats?.activeFisherfolk },
    { title: "Vessels", value: stats?.totalVessels },
    { title: "Active Violations", value: stats?.activeViolations },
    { title: "Users", value: stats?.totalUsers },
    { title: "Pending Edit Requests", value: stats?.pendingEditRequests },
  ] as const;

  // ── Barangay section ───────────────────────────────────────────────────────
  const top12 = barangayData?.slice(0, 12) ?? [];
  const maxBarangay = top12[0]?.count ?? 0;

  // ── Category section ───────────────────────────────────────────────────────
  const categories = demo?.categories ?? [];
  const maxCategory =
    categories.length > 0
      ? Math.max(...categories.map((c) => c.count))
      : 0;

  return (
    <div className="space-y-8">
      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              loading={statsLoading}
            />
          ))}
        </div>
      </section>

      {/* ── Two-column panels ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Registered by Barangay */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registered by Barangay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {barangayLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Shimmer key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : top12.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No barangay data yet.
              </p>
            ) : (
              top12.map((row) => (
                <CssBar
                  key={row.barangay}
                  label={row.barangay}
                  count={row.count}
                  max={maxBarangay}
                  colorClass="bg-primary"
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Shimmer key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No categories configured.
              </p>
            ) : (
              categories.map((cat) => (
                <CssBar
                  key={cat.name}
                  label={cat.name}
                  count={cat.count}
                  max={maxCategory}
                  colorClass="bg-chart-2"
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Demographics row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Sex */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sex</CardTitle>
          </CardHeader>
          <CardContent>
            {demoLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Shimmer key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y">
                <StatRow
                  label="Male"
                  count={demo?.sex.male ?? 0}
                  colorClass="bg-blue-500"
                />
                <StatRow
                  label="Female"
                  count={demo?.sex.female ?? 0}
                  colorClass="bg-pink-500"
                />
                <StatRow
                  label="Unspecified"
                  count={demo?.sex.unspecified ?? 0}
                  colorClass="bg-muted-foreground"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Age Buckets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Age Groups</CardTitle>
          </CardHeader>
          <CardContent>
            {demoLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Shimmer key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y">
                <StatRow
                  label="Senior (60+)"
                  count={demo?.ageBuckets.senior ?? 0}
                  colorClass="bg-amber-500"
                />
                <StatRow
                  label="Adult (18–59)"
                  count={demo?.ageBuckets.adult ?? 0}
                  colorClass="bg-primary"
                />
                <StatRow
                  label="Minor (<18)"
                  count={demo?.ageBuckets.minor ?? 0}
                  colorClass="bg-chart-3"
                />
                <StatRow
                  label="Unknown DOB"
                  count={demo?.ageBuckets.unknown ?? 0}
                  colorClass="bg-muted-foreground"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Status Breakdown ───────────────────────────────────────────────── */}
      {!demoLoading && (demo?.status?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registration Status</CardTitle>
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
          {/* Missing Photo */}
          <Link
            href={`/${tenantSlug}/fisherfolk?missing=photo`}
            className="group"
          >
            <Card className="cursor-pointer transition-colors hover:border-primary/50">
              <CardContent className="flex items-center gap-4 pt-5 pb-5">
                <ImageOff className="h-8 w-8 shrink-0 text-muted-foreground" />
                <div>
                  {statsLoading ? (
                    <Shimmer className="mb-1 h-8 w-20" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">
                      {(stats?.missingPhoto ?? 0).toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">Missing Photo</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Missing Signature */}
          <Link
            href={`/${tenantSlug}/fisherfolk?missing=signature`}
            className="group"
          >
            <Card className="cursor-pointer transition-colors hover:border-primary/50">
              <CardContent className="flex items-center gap-4 pt-5 pb-5">
                <FileX2 className="h-8 w-8 shrink-0 text-muted-foreground" />
                <div>
                  {statsLoading ? (
                    <Shimmer className="mb-1 h-8 w-20" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">
                      {(stats?.missingSignature ?? 0).toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Missing Signature
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
