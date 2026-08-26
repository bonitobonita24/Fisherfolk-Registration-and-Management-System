"use client";

import Link from "next/link";

import { GEAR_TYPE_LABELS, CATCH_DISPOSITION_LABELS } from "@frms/shared/constants";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecordHeader, DetailField, DefinitionGrid } from "@/components/shared";

interface Props {
  id: string;
}

function formatDate(value: Date | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPeso(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
}

function formatKg(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("en-PH", { maximumFractionDigits: 2 })} kg`;
}

export function FishCatchDetailClient({ id }: Props) {
  const tenantHref = useTenantHref();

  const {
    data: record,
    isLoading,
    isError,
    error,
  } = trpc.fishCatch.getById.useQuery({ id });

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading fish catch record…</p>
    );
  }

  if (isError) {
    const notFound = error?.data?.code === "NOT_FOUND";
    return (
      <div className="space-y-4 pb-4">
        <RecordHeader
          backHref={tenantHref("/fish-catches")}
          backLabel="Back to fish catches"
          title="Fish catch record"
        />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {notFound
                ? "Fish catch record not found."
                : "Failed to load fish catch record."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) return null;

  const fisherfolkName = `${record.fisherfolk.firstName} ${record.fisherfolk.lastName}`;

  const totalWeightKg = record.species.reduce(
    (sum, s) => sum + Number(s.weightKg ?? 0),
    0,
  );
  const totalValuePhp = record.species.reduce(
    (sum, s) => sum + Number(s.valuePhp ?? 0),
    0,
  );

  const totalCatchKg = Number(record.totalCatchKg ?? 0);
  const fishingHours = record.fishingHours != null ? Number(record.fishingHours) : null;
  const cpue =
    fishingHours != null && fishingHours > 0
      ? (totalCatchKg / fishingHours).toFixed(2)
      : null;
  const kgPerTrip =
    record.numTrips > 0 ? (totalCatchKg / record.numTrips).toFixed(2) : null;

  return (
    <div className="space-y-4 pb-4">
      <RecordHeader
        backHref={tenantHref("/fish-catches")}
        backLabel="Back to fish catches"
        title={record.referenceNo}
        meta={formatDate(record.landingDate)}
      />

      {/* Catch details */}
      <Card className="gap-0 py-5">
        <CardHeader className="px-6 pb-4 pt-0">
          <CardTitle className="text-sm font-medium">Catch Details</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-0">
          <DefinitionGrid columns={3}>
            <DetailField
              label="Fisherfolk"
              value={
                <Link
                  href={tenantHref(`/fisherfolk/${record.fisherfolk.id}`)}
                  className="text-primary hover:underline"
                >
                  {fisherfolkName} · {record.fisherfolk.idNumber}
                </Link>
              }
            />
            <DetailField
              label="Vessel"
              value={
                record.vessel ? (
                  <Link
                    href={tenantHref(`/vessels/${record.vessel.id}`)}
                    className="text-primary hover:underline"
                  >
                    {record.vessel.vesselName ?? record.vessel.mfvrNumber}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <DetailField
              label="Landing Date"
              value={`${formatDate(record.landingDate)}${
                record.landingTime ? ` · ${record.landingTime}` : ""
              }`}
            />
            <DetailField
              label="Fishing Ground"
              value={record.fishingGroundBarangay ?? record.fishingGroundLabel}
            />
            <DetailField label="FMA" value={record.fmaCode} />
            <DetailField
              label="Gear"
              value={`${GEAR_TYPE_LABELS[record.gearType]}${
                record.gearDetail ? ` — ${record.gearDetail}` : ""
              }`}
            />
            <DetailField
              label="Effort"
              value={[
                record.gearUnits != null ? `${record.gearUnits} unit(s)` : null,
                record.fishingHours != null
                  ? `${Number(record.fishingHours)}h`
                  : null,
                `${record.numTrips} trip(s)`,
                record.numFishers != null
                  ? `${record.numFishers} fisher(s)`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
            <DetailField label="Total Catch" value={formatKg(record.totalCatchKg)} />
            <DetailField
              label="Est. Value"
              value={formatPeso(record.estimatedValuePhp)}
            />
            <DetailField
              label="Disposition"
              value={
                record.disposition
                  ? CATCH_DISPOSITION_LABELS[record.disposition]
                  : "—"
              }
            />
            <DetailField label="Source" value={record.source} />
            <DetailField label="Recorded By" value={record.recordedBy?.name} />
            <DetailField label="Remarks" value={record.remarks} />
            <DetailField
              label="CPUE (kg/hr)"
              value={cpue ? `${cpue} kg/hr` : "—"}
            />
            <DetailField
              label="Catch per Trip (kg/trip)"
              value={kgPerTrip ? `${kgPerTrip} kg/trip` : "—"}
            />
          </DefinitionGrid>
        </CardContent>
      </Card>

      {/* Species composition */}
      <Card className="gap-0 py-5">
        <CardHeader className="px-6 pb-4 pt-0">
          <CardTitle className="text-sm font-medium">Species Composition</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-0">
          {record.species.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Species composition for catch {record.referenceNo}
                </caption>
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Species
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Weight
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Qty
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Price/kg
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Value
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Disposition
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Avg Length
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {record.species.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-sm">
                        <p className="font-medium text-foreground">
                          {s.commonName}
                        </p>
                        {s.scientificName ? (
                          <p className="text-xs italic text-muted-foreground">
                            {s.scientificName}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-2 pr-4 text-sm">{formatKg(s.weightKg)}</td>
                      <td className="py-2 pr-4 text-sm">{s.quantityPcs ?? "—"}</td>
                      <td className="py-2 pr-4 text-sm">{formatPeso(s.pricePerKgPhp)}</td>
                      <td className="py-2 pr-4 text-sm">{formatPeso(s.valuePhp)}</td>
                      <td className="py-2 pr-4 text-sm">
                        {s.disposition
                          ? CATCH_DISPOSITION_LABELS[s.disposition]
                          : "—"}
                      </td>
                      <td className="py-2 pr-4 text-sm">
                        {s.avgLengthCm != null
                          ? `${Number(s.avgLengthCm)} cm`
                          : "—"}
                        {s.sizeClass != null && s.sizeClass !== ""
                          ? ` (${s.sizeClass})`
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <th scope="row" className="py-2 pr-4 text-left text-sm font-medium">
                      Total
                    </th>
                    <td className="py-2 pr-4 text-sm">{formatKg(totalWeightKg)}</td>
                    <td className="py-2 pr-4" />
                    <td className="py-2 pr-4" />
                    <td className="py-2 pr-4 text-sm">{formatPeso(totalValuePhp)}</td>
                    <td className="py-2 pr-4" />
                    <td className="py-2 pr-4" />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No species recorded for this catch.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
