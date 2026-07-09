"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { GEAR_TYPE_LABELS, CATCH_DISPOSITION_LABELS } from "@frms/shared/constants";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared";

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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">
        {value === null || value === undefined || value === "" ? "—" : value}
      </p>
    </div>
  );
}

export function FishCatchDetailClient({ id }: Props) {
  const params = useParams<{ tenant: string }>();

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
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${params.tenant}/fish-catches`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${params.tenant}/fish-catches`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <PageHeader
            title={record.referenceNo}
            description={formatDate(record.landingDate)}
          />
        </div>
      </div>

      {/* Catch details */}
      <Card>
        <CardHeader>
          <CardTitle>Catch Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Fisherfolk"
              value={
                <Link
                  href={`/${params.tenant}/fisherfolk/${record.fisherfolk.id}`}
                  className="text-primary hover:underline"
                >
                  {fisherfolkName} · {record.fisherfolk.idNumber}
                </Link>
              }
            />
            <Field
              label="Vessel"
              value={
                record.vessel ? (
                  <Link
                    href={`/${params.tenant}/vessels/${record.vessel.id}`}
                    className="text-primary hover:underline"
                  >
                    {record.vessel.vesselName ?? record.vessel.mfvrNumber}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <Field
              label="Landing Date"
              value={`${formatDate(record.landingDate)}${
                record.landingTime ? ` · ${record.landingTime}` : ""
              }`}
            />
            <Field
              label="Fishing Ground"
              value={record.fishingGroundBarangay ?? record.fishingGroundLabel}
            />
            <Field label="FMA" value={record.fmaCode} />
            <Field
              label="Gear"
              value={`${GEAR_TYPE_LABELS[record.gearType]}${
                record.gearDetail ? ` — ${record.gearDetail}` : ""
              }`}
            />
            <Field
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
            <Field label="Total Catch" value={formatKg(record.totalCatchKg)} />
            <Field
              label="Est. Value"
              value={formatPeso(record.estimatedValuePhp)}
            />
            <Field
              label="Disposition"
              value={
                record.disposition
                  ? CATCH_DISPOSITION_LABELS[record.disposition]
                  : "—"
              }
            />
            <Field label="Source" value={record.source} />
            <Field label="Recorded By" value={record.recordedBy?.name} />
            <Field label="Remarks" value={record.remarks} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
            <Field
              label="CPUE (kg/hr)"
              value={cpue ? `${cpue} kg/hr` : "—"}
            />
            <Field
              label="Catch per Trip (kg/trip)"
              value={kgPerTrip ? `${kgPerTrip} kg/trip` : "—"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Species composition */}
      <Card>
        <CardHeader>
          <CardTitle>Species Composition</CardTitle>
        </CardHeader>
        <CardContent>
          {record.species.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Species composition for catch {record.referenceNo}
                </caption>
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
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
                      <td className="py-2 pr-4">
                        <p className="font-medium text-foreground">
                          {s.commonName}
                        </p>
                        {s.scientificName ? (
                          <p className="text-xs italic text-muted-foreground">
                            {s.scientificName}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-2 pr-4">{formatKg(s.weightKg)}</td>
                      <td className="py-2 pr-4">{s.quantityPcs ?? "—"}</td>
                      <td className="py-2 pr-4">{formatPeso(s.pricePerKgPhp)}</td>
                      <td className="py-2 pr-4">{formatPeso(s.valuePhp)}</td>
                      <td className="py-2 pr-4">
                        {s.disposition
                          ? CATCH_DISPOSITION_LABELS[s.disposition]
                          : "—"}
                      </td>
                      <td className="py-2 pr-4">
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
                    <th scope="row" className="py-2 pr-4 text-left font-medium">
                      Total
                    </th>
                    <td className="py-2 pr-4">{formatKg(totalWeightKg)}</td>
                    <td className="py-2 pr-4" />
                    <td className="py-2 pr-4" />
                    <td className="py-2 pr-4">{formatPeso(totalValuePhp)}</td>
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
