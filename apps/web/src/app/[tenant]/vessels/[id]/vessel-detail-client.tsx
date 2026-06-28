"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { renderQRDataUrl } from "@/lib/qr-code";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";

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

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toString();
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

export function VesselDetailClient({ id }: Props) {
  const params = useParams<{ tenant: string }>();

  const {
    data: record,
    isLoading,
    isError,
    error,
  } = trpc.vessel.getById.useQuery({ id });

  const { data: photoUrlResp } = trpc.upload.getDownloadUrl.useQuery(
    { key: record?.vesselPhoto ?? "" },
    { enabled: !!record?.vesselPhoto },
  );

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!record?.qrCode) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void renderQRDataUrl(record.qrCode).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [record?.qrCode]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading vessel…</p>;
  }

  if (isError) {
    const notFound = error?.data?.code === "NOT_FOUND";
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${params.tenant}/vessels`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {notFound ? "Vessel not found." : "Failed to load vessel."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) return null;

  const displayName = record.vesselName ?? record.mfvrNumber;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${params.tenant}/vessels`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{record.mfvrNumber}</p>
          </div>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main detail cards */}
        <div className="space-y-6 lg:col-span-2">
          {/* Identification */}
          <Card>
            <CardHeader>
              <CardTitle>Identification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="MFVR Number" value={record.mfvrNumber} />
                <Field label="Vessel Name" value={record.vesselName} />
                <Field label="Vessel Type" value={record.vesselType} />
                <Field label="Status" value={record.status} />
              </div>
            </CardContent>
          </Card>

          {/* Linked Owners */}
          <Card>
            <CardHeader>
              <CardTitle>Linked Owners</CardTitle>
            </CardHeader>
            <CardContent>
              {record.owners.length > 0 ? (
                <ul className="divide-y">
                  {record.owners.map((owner) => (
                    <li key={owner.id} className="py-2 first:pt-0 last:pb-0">
                      <Link
                        href={`/${params.tenant}/fisherfolk/${owner.id}`}
                        className="flex items-center justify-between gap-2 hover:underline"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {owner.fullName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {owner.idNumber}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No linked owners.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Construction */}
          <Card>
            <CardHeader>
              <CardTitle>Construction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Hull Material" value={record.hullMaterial} />
                <Field label="Place Built" value={record.placeBuilt} />
                <Field label="Year Built" value={formatNumber(record.yearBuilt)} />
              </div>
            </CardContent>
          </Card>

          {/* Dimensions */}
          <Card>
            <CardHeader>
              <CardTitle>Dimensions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Registered Length"
                  value={formatNumber(record.registeredLength)}
                />
                <Field
                  label="Registered Breadth"
                  value={formatNumber(record.registeredBreadth)}
                />
                <Field
                  label="Registered Depth"
                  value={formatNumber(record.registeredDepth)}
                />
                <Field
                  label="Gross Tonnage"
                  value={formatNumber(record.grossTonnage)}
                />
                <Field
                  label="Net Tonnage"
                  value={formatNumber(record.netTonnage)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Engine */}
          <Card>
            <CardHeader>
              <CardTitle>Engine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Engine Make" value={record.engineMake} />
                <Field
                  label="Engine Serial Number"
                  value={record.engineSerialNumber}
                />
                <Field
                  label="Horsepower"
                  value={formatNumber(record.horsepower)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Operations */}
          <Card>
            <CardHeader>
              <CardTitle>Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Homeport" value={record.homeport} />
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Fishing Gear Classification
                </p>
                {record.fishingGearClassification.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {record.fishingGearClassification.map((gear) => (
                      <Badge key={gear} variant="secondary">
                        {gear}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground">—</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Violations */}
          <Card>
            <CardHeader>
              <CardTitle>Active Violations</CardTitle>
            </CardHeader>
            <CardContent>
              {record.violations.length > 0 ? (
                <ul className="divide-y">
                  {record.violations.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                          {v.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(v.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline">{v.status}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active violations.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: photo + QR */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photo</CardTitle>
            </CardHeader>
            <CardContent>
              {record.vesselPhoto && photoUrlResp?.url ? (
                <img
                  src={photoUrlResp.url}
                  alt={`${displayName} photo`}
                  className="aspect-[1/1] w-full rounded-md border bg-muted object-cover"
                />
              ) : (
                <div className="flex aspect-[1/1] w-full items-center justify-center rounded-md border bg-muted">
                  <p className="text-xs text-muted-foreground">No photo</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`${record.mfvrNumber} QR code`}
                  className="mx-auto h-48 w-48 rounded-md border bg-white p-2"
                />
              ) : (
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-md border bg-muted">
                  <p className="text-xs text-muted-foreground">
                    {record.qrCode ? "Rendering…" : "No QR code"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
