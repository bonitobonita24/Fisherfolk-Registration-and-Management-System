"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageOff } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { renderQRDataUrl } from "@/lib/qr-code";
import { useTenantHref } from "@/lib/use-tenant-href";
import { MakeTodoDialog } from "@/components/todo/make-todo-dialog";
import { LinkedTodos } from "@/components/todo/linked-todos";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  DefinitionGrid,
  DetailField,
  RecordHeader,
  LocationPicker,
} from "@/components/shared";

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

export function VesselDetailClient({ id }: Props) {
  const tenantHref = useTenantHref();

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
          <Link href={tenantHref("/vessels")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <Card className="gap-0 py-5">
          <CardContent className="px-6 py-10 text-center">
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
    <div className="space-y-4 pb-4">
      <RecordHeader
        backHref={tenantHref("/vessels")}
        backLabel="Back to vessels"
        title={displayName}
        meta={record.mfvrNumber}
        badge={<StatusBadge status={record.status} />}
        actions={
          <MakeTodoDialog
            sourceEntityType="vessel"
            sourceEntityId={id}
            defaultTitle={`Follow up / missing data: ${record.mfvrNumber}`}
          />
        }
      />

      {/* Identification — compact media column + full-width definition grid */}
      <Card className="gap-0 py-5">
        <CardHeader className="px-6 pb-4 pt-0">
          <CardTitle className="text-sm font-medium">Identification</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-0">
          <div className="flex flex-col gap-6 sm:flex-row">
            {/* Media column — photo + QR side-by-side, compact */}
            <div className="grid w-full shrink-0 grid-cols-2 gap-3 self-start sm:w-64">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Photo</p>
                {record.vesselPhoto && photoUrlResp?.url ? (
                  <img
                    src={photoUrlResp.url}
                    alt={displayName}
                    className="aspect-square w-full rounded-lg border bg-muted object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border bg-muted">
                    <ImageOff size={20} className="text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground">
                      No photo
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">QR Code</p>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`${record.mfvrNumber} QR code`}
                    className="aspect-square w-full rounded-lg border bg-white p-1.5"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg border bg-muted">
                    <p className="text-[11px] text-muted-foreground">
                      {record.qrCode ? "…" : "No QR"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Identification fields — fill the remaining width */}
            <div className="min-w-0 flex-1">
              <DefinitionGrid columns={3}>
                <DetailField label="MFVR Number" value={record.mfvrNumber} />
                <DetailField label="Vessel Name" value={record.vesselName} />
                <DetailField label="Vessel Type" value={record.vesselType} />
                <DetailField label="Status" value={record.status} />
                <DetailField
                  label="Hull Material"
                  value={record.hullMaterial}
                />
                <DetailField label="Place Built" value={record.placeBuilt} />
                <DetailField
                  label="Year Built"
                  value={formatNumber(record.yearBuilt)}
                />
                <DetailField label="Homeport" value={record.homeport} />
              </DefinitionGrid>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related records — compact grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Dimensions */}
        <Card className="gap-0 py-5">
          <CardHeader className="px-6 pb-4 pt-0">
            <CardTitle className="text-sm font-medium">Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-0">
            <DefinitionGrid columns={2} className="lg:grid-cols-2">
              <DetailField
                label="Registered Length"
                value={formatNumber(record.registeredLength)}
              />
              <DetailField
                label="Registered Breadth"
                value={formatNumber(record.registeredBreadth)}
              />
              <DetailField
                label="Registered Depth"
                value={formatNumber(record.registeredDepth)}
              />
              <DetailField
                label="Gross Tonnage"
                value={formatNumber(record.grossTonnage)}
              />
              <DetailField
                label="Net Tonnage"
                value={formatNumber(record.netTonnage)}
              />
            </DefinitionGrid>
          </CardContent>
        </Card>

        {/* Engine */}
        <Card className="gap-0 py-5">
          <CardHeader className="px-6 pb-4 pt-0">
            <CardTitle className="text-sm font-medium">Engine</CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-0">
            <DefinitionGrid columns={2} className="lg:grid-cols-2">
              <DetailField label="Engine Make" value={record.engineMake} />
              <DetailField
                label="Engine Serial Number"
                value={record.engineSerialNumber}
              />
              <DetailField
                label="Horsepower"
                value={formatNumber(record.horsepower)}
              />
            </DefinitionGrid>
          </CardContent>
        </Card>

        {/* Fishing Gear */}
        <Card className="gap-0 py-5">
          <CardHeader className="px-6 pb-4 pt-0">
            <CardTitle className="text-sm font-medium">
              Fishing Gear Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-0">
            {record.fishingGearClassification.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {record.fishingGearClassification.map((gear) => (
                  <Badge key={gear} variant="secondary">
                    {gear}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No gear classification recorded.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Linked Owners */}
        <Card className="gap-0 py-5">
          <CardHeader className="px-6 pb-4 pt-0">
            <CardTitle className="text-sm font-medium">Linked Owners</CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-0">
            {record.owners.length > 0 ? (
              <ul className="divide-y">
                {record.owners.map((owner) => (
                  <li key={owner.id} className="py-2 first:pt-0 last:pb-0">
                    <Link
                      href={tenantHref(`/fisherfolk/${owner.id}`)}
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

        {/* Number of Violations */}
        <Card className="gap-0 py-5">
          <CardHeader className="px-6 pb-4 pt-0">
            <CardTitle className="text-sm font-medium">
              Number of Violations ({record.violations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-0">
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
                    <StatusBadge status={v.status} />
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

        {/* Location */}
        <Card className="gap-0 py-5">
          <CardHeader className="px-6 pb-4 pt-0">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-0">
            {record.latitude != null && record.longitude != null ? (
              <LocationPicker
                disabled
                value={{ lat: record.latitude, lng: record.longitude }}
                onChange={() => {}}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No location set
              </p>
            )}
          </CardContent>
        </Card>

        {/* Linked ToDos */}
        <LinkedTodos sourceEntityType="vessel" sourceEntityId={id} />
      </div>
    </div>
  );
}
