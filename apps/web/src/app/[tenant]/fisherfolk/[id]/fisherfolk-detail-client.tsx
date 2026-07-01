"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileX2,
  ImageOff,
  Pencil,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { renderQRDataUrl } from "@/lib/qr-code";
import { FisherfolkActivityTimeline } from "./fisherfolk-activity-timeline";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
  const utils = trpc.useUtils();

  const {
    data: record,
    isLoading,
    isError,
    error,
  } = trpc.fisherfolk.getById.useQuery({ id });

  const { data: me } = trpc.user.me.useQuery();

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

  const renewMutation = trpc.fisherfolk.renew.useMutation();
  const releaseMutation = trpc.fisherfolk.markIdReleased.useMutation();

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

  const role = me?.role;
  const canAct =
    role === "encoder" || role === "admin" || role === "super_admin";
  const hasActiveViolation = record.violations.some(
    (v) => v.status === "ACTIVE",
  );
  const isAlreadyReleased = !!record.idReleasedAt;

  const isRenewed = record.renewals.length > 0;
  const latestRenewal = record.renewals[0];

  const handleRenew = async () => {
    try {
      await renewMutation.mutateAsync({ id });
      void utils.fisherfolk.getById.invalidate({ id });
      void utils.fisherfolk.getActivity.invalidate({ id });
      toast.success("Registration renewed successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to renew registration.",
      );
      throw err; // re-throw so ConfirmDialog keeps itself open
    }
  };

  const handleMarkReleased = async () => {
    try {
      await releaseMutation.mutateAsync({ id });
      void utils.fisherfolk.getById.invalidate({ id });
      void utils.fisherfolk.getActivity.invalidate({ id });
      toast.success("ID marked as released.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to mark ID as released.",
      );
      throw err; // re-throw so ConfirmDialog keeps itself open
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="sm" className="mt-1 shrink-0">
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
            {/* Registration status line */}
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <StatusBadge
                status={isRenewed ? "RENEWED" : "NEW"}
                color={isRenewed ? "orange" : "green"}
                icon={isRenewed ? RefreshCw : Sparkles}
              />
              <span className="text-xs text-muted-foreground">
                {isRenewed
                  ? `Last renewed ${formatDate(latestRenewal?.renewedAt)}`
                  : "New registration"}
              </span>
              <span className="text-xs text-muted-foreground" aria-hidden="true">
                ·
              </span>
              <span className="text-xs text-muted-foreground">
                Originally joined {formatDate(record.dateJoined)}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons area — encoder/admin/super_admin only */}
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {canAct && (
            <>
              {/* Renew Registration — disabled + tooltip when active violation */}
              {hasActiveViolation ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* span receives pointer/focus events when button is disabled */}
                      <span
                        tabIndex={0}
                        aria-label="Renew registration (blocked: active violation on record)"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          aria-disabled="true"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Renew
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Cannot renew: fisherfolk has an active violation on
                      record.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Renew registration"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Renew
                    </Button>
                  }
                  title="Renew Registration"
                  description={`Renew ${record.fullName}'s fisherfolk registration for the current year. This sets their status to RENEWED.`}
                  confirmLabel="Confirm Renewal"
                  variant="default"
                  onConfirm={handleRenew}
                />
              )}

              {/* Mark ID as Released — hidden once already released */}
              {!isAlreadyReleased && (
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Mark ID as released"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark ID Released
                    </Button>
                  }
                  title="Mark ID as Released"
                  description={`Confirm that ${record.fullName}'s fisherfolk ID card has been physically released to them. This action cannot be undone.`}
                  confirmLabel="Confirm Release"
                  variant="default"
                  onConfirm={handleMarkReleased}
                />
              )}
            </>
          )}

          {canAct && (
            <Separator orientation="vertical" className="mx-0.5 h-6" />
          )}

          <Button asChild variant="outline" size="sm">
            <Link href={`/${params.tenant}/fisherfolk/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <StatusBadge status={record.status} />
        </div>
      </div>

      {/* Two-column shell: main content left + activity timeline right */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* LEFT main column */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 sm:flex-row">
                {/* Media column — photo / signature / QR */}
                <div className="grid shrink-0 grid-cols-3 gap-3 sm:flex sm:w-40 sm:flex-col">
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Photo
                    </p>
                    {record.photo && photoUrlResp?.url ? (
                      <img
                        src={photoUrlResp.url}
                        alt={`Portrait of ${record.fullName}`}
                        className="aspect-square w-full rounded-lg border bg-muted object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border bg-muted">
                        <ImageOff size={20} className="text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground">
                          No image
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Signature
                    </p>
                    {record.signature && signatureUrlResp?.url ? (
                      <img
                        src={signatureUrlResp.url}
                        alt={`${record.fullName} signature`}
                        className="h-16 w-full rounded-md border bg-white object-contain"
                      />
                    ) : (
                      <div className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-md border bg-muted">
                        <FileX2 size={16} className="text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground">
                          None
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      QR Code
                    </p>
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={`${record.idNumber} QR code`}
                        className="aspect-square w-full rounded-lg border bg-white p-1.5"
                      />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center rounded-lg border bg-muted">
                        <p className="text-[10px] text-muted-foreground">
                          {record.qrCode ? "…" : "No QR"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fields */}
                <div className="min-w-0 flex-1 space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="ID Number" value={record.idNumber} />
                    <Field label="RSBSA Number" value={record.rsbsaNumber} />
                    <Field label="Status" value={record.status} />
                    <Field label="Last Name" value={record.lastName} />
                    <Field label="First Name" value={record.firstName} />
                    <Field label="Middle Name" value={record.middleName} />
                    <Field label="Suffix" value={record.suffix} />
                    <Field
                      label="Date of Birth"
                      value={formatDate(record.dateOfBirth)}
                    />
                    <Field label="Sex" value={record.sex} />
                    <Field label="Civil Status" value={record.civilStatus} />
                    <Field
                      label="Contact Number"
                      value={record.contactNumber}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Barangay" value={record.barangay} />
                    <Field
                      label="Date Joined"
                      value={formatDate(record.dateJoined)}
                    />
                    <Field
                      label="Registration Year"
                      value={record.registrationYear}
                    />
                    <Field label="Remarks" value={record.remarks} />
                  </div>

                  <Separator />

                  {/* ID release status */}
                  <div className="flex items-center gap-2">
                    {isAlreadyReleased ? (
                      <>
                        <CheckCircle
                          className="h-4 w-4 shrink-0 text-green-600"
                          aria-hidden="true"
                        />
                        <span className="text-sm">
                          ID released on {formatDate(record.idReleasedAt)}
                          {record.idReleasedBy
                            ? ` by ${record.idReleasedBy.name ?? record.idReleasedBy.email}`
                            : ""}
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="text-sm text-muted-foreground">
                          ID not yet released
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Renewal History */}
          <Card>
            <CardHeader>
              <CardTitle>Renewal History</CardTitle>
            </CardHeader>
            <CardContent>
              {record.renewals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No renewals yet.
                </p>
              ) : (
                <ul
                  className="divide-y divide-border"
                  aria-label="Renewal history"
                >
                  {record.renewals.map((r) => (
                    <li key={r.id} className="space-y-0.5 py-3 first:pt-0 last:pb-0">
                      <p className="text-sm font-medium text-foreground">
                        {r.renewalYear}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(r.renewedAt)} &middot;{" "}
                        {r.renewedBy?.name ??
                          r.renewedBy?.email ??
                          "Unknown staff"}
                        {r.notes ? ` · ${r.notes}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Related records — compact 3-up grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Registered Vessels */}
            <Card>
              <CardHeader>
                <CardTitle>Registered Vessels</CardTitle>
              </CardHeader>
              <CardContent>
                {record.vessels.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No registered vessels.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {record.vessels.map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/${params.tenant}/vessels/${v.id}`}
                            className="text-sm font-medium text-foreground hover:underline"
                          >
                            {v.vesselName}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {v.mfvrNumber} &middot; {v.vesselType}
                          </p>
                        </div>
                        <StatusBadge status={v.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Latest Violations */}
            <Card>
              <CardHeader>
                <CardTitle>Latest Violations</CardTitle>
              </CardHeader>
              <CardContent>
                {record.violations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No violations on record.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {record.violations.map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/${params.tenant}/violations/${v.id}`}
                            className="text-sm font-medium text-foreground hover:underline"
                          >
                            {v.subject}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(v.createdAt)}
                          </p>
                        </div>
                        <StatusBadge
                          status={v.status}
                          color={v.status === "ACTIVE" ? "red" : "green"}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Ayuda Received */}
            <Card>
              <CardHeader>
                <CardTitle>Ayuda Received</CardTitle>
              </CardHeader>
              <CardContent>
                {record.ayudaBeneficiaries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No ayuda programs.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {record.ayudaBeneficiaries.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/${params.tenant}/ayuda/${b.program.id}`}
                            className="text-sm font-medium text-foreground hover:underline"
                          >
                            {b.program.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {b.verifiedAt
                              ? `Received ${formatDate(b.verifiedAt)}`
                              : `Added ${formatDate(b.createdAt)}`}
                          </p>
                        </div>
                        <StatusBadge status={b.verificationStatus} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT — activity timeline slot (S4) */}
        <aside aria-label="Activity timeline">
          <FisherfolkActivityTimeline id={id} />
        </aside>
      </div>
    </div>
  );
}
