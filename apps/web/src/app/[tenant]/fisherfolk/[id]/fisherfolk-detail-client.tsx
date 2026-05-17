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

export function FisherfolkDetailClient({ id }: Props) {
  const params = useParams<{ tenant: string }>();

  const {
    data: record,
    isLoading,
    isError,
    error,
  } = trpc.fisherfolk.getById.useQuery({ id });

  const { data: photoUrlResp } = trpc.upload.getDownloadUrl.useQuery(
    { key: record?.photo ?? "" },
    { enabled: !!record?.photo },
  );

  const { data: signatureUrlResp } = trpc.upload.getDownloadUrl.useQuery(
    { key: record?.signature ?? "" },
    { enabled: !!record?.signature },
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
    return (
      <p className="text-sm text-muted-foreground">Loading fisherfolk…</p>
    );
  }

  if (isError) {
    const notFound = error?.data?.code === "NOT_FOUND";
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${params.tenant}/fisherfolk`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {notFound
                ? "Fisherfolk not found."
                : "Failed to load fisherfolk."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${params.tenant}/fisherfolk`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {record.fullName}
            </h1>
            <p className="text-sm text-muted-foreground">{record.idNumber}</p>
          </div>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="ID Number" value={record.idNumber} />
              <Field label="RSBSA Number" value={record.rsbsaNumber} />
              <Field label="Status" value={record.status} />
              <Field label="Last Name" value={record.lastName} />
              <Field label="First Name" value={record.firstName} />
              <Field label="Middle Name" value={record.middleName} />
              <Field label="Suffix" value={record.suffix} />
              <Field label="Date of Birth" value={formatDate(record.dateOfBirth)} />
              <Field label="Sex" value={record.sex} />
              <Field label="Civil Status" value={record.civilStatus} />
              <Field label="Contact Number" value={record.contactNumber} />
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Barangay" value={record.barangay} />
              <Field label="Address" value={record.address} />
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Date Joined" value={formatDate(record.dateJoined)} />
              <Field
                label="Registration Year"
                value={record.registrationYear}
              />
              <Field label="Remarks" value={record.remarks} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photo</CardTitle>
            </CardHeader>
            <CardContent>
              {record.photo && photoUrlResp?.url ? (
                <img
                  src={photoUrlResp.url}
                  alt={`${record.fullName} photo`}
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
              <CardTitle>Signature</CardTitle>
            </CardHeader>
            <CardContent>
              {record.signature && signatureUrlResp?.url ? (
                <img
                  src={signatureUrlResp.url}
                  alt={`${record.fullName} signature`}
                  className="h-32 w-full rounded-md border bg-white object-contain"
                />
              ) : (
                <div className="flex h-32 w-full items-center justify-center rounded-md border bg-muted">
                  <p className="text-xs text-muted-foreground">No signature</p>
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
                  alt={`${record.idNumber} QR code`}
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
