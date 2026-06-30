"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ImageOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { AttachmentList } from "@/components/shared/attachment-list";

interface Props {
  id: string;
  canManage: boolean;
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

function EvidenceImage({ imageKey }: { imageKey: string }) {
  const { data } = trpc.upload.getDownloadUrl.useQuery(
    { key: imageKey },
    { enabled: !!imageKey },
  );
  if (!data?.url) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-md border bg-muted">
        <p className="text-xs text-muted-foreground">Loading…</p>
      </div>
    );
  }
  return (
    <img
      src={data.url}
      alt="Evidence"
      className="aspect-square w-full rounded-md border bg-muted object-cover"
    />
  );
}

export function ViolationDetailClient({ id, canManage }: Props) {
  const params = useParams<{ tenant: string }>();

  const {
    data: record,
    isLoading,
    isError,
    error,
  } = trpc.violation.getById.useQuery({ id });

  const { data: fisherfolkPhotoResp } = trpc.upload.getDownloadUrl.useQuery(
    { key: record?.fisherfolk?.photo ?? "" },
    { enabled: !!record?.fisherfolk?.photo },
  );

  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const lift = trpc.violation.lift.useMutation({
    onSuccess: () => {
      toast.success("Violation lifted.");
      setOpen(false);
      setNotes("");
      void utils.violation.getById.invalidate({ id });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to lift violation.");
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading violation…</p>;
  }

  if (isError) {
    const notFound = error?.data?.code === "NOT_FOUND";
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${params.tenant}/violations`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {notFound ? "Violation not found." : "Failed to load violation."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) return null;

  const targetFisherfolk =
    record.targetType === "FISHERFOLK" || record.targetType === "BOTH"
      ? record.fisherfolk
      : null;
  const targetVessel =
    record.targetType === "VESSEL" || record.targetType === "BOTH"
      ? record.vessel
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${params.tenant}/violations`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {record.subject}
            </h1>
            <p className="text-sm text-muted-foreground">
              Filed {formatDate(record.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge
                status={record.status}
                color={record.status === "ACTIVE" ? "red" : "green"}
              />
          {canManage && record.status === "ACTIVE" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Lift / Resolve</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lift / Resolve Violation</DialogTitle>
                  <DialogDescription>
                    Provide resolution notes before closing this violation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="resolutionNotes">Resolution notes</Label>
                  <Textarea
                    id="resolutionNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe how this violation was resolved…"
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => lift.mutate({ id, resolutionNotes: notes })}
                    disabled={notes.trim().length === 0 || lift.isPending}
                  >
                    {lift.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Lifting…
                      </>
                    ) : (
                      "Confirm lift"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Top row: violator profile (left) beside Violation Details (right) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile — full violator details with picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {targetFisherfolk ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {targetFisherfolk.photo && fisherfolkPhotoResp?.url ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          aria-label="Zoom photo"
                          className="shrink-0 cursor-zoom-in rounded-lg border bg-muted transition hover:ring-2 hover:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <img
                            src={fisherfolkPhotoResp.url}
                            alt={`Portrait of ${targetFisherfolk.fullName}`}
                            className="h-32 w-32 rounded-lg object-cover"
                          />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{targetFisherfolk.fullName}</DialogTitle>
                          <DialogDescription>
                            {targetFisherfolk.idNumber}
                          </DialogDescription>
                        </DialogHeader>
                        <img
                          src={fisherfolkPhotoResp.url}
                          alt={`Portrait of ${targetFisherfolk.fullName}`}
                          className="max-h-[80vh] w-full rounded-md object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border bg-muted">
                      <ImageOff size={28} className="text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">No photo</p>
                    </div>
                  )}
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/${params.tenant}/fisherfolk/${targetFisherfolk.id}`}
                      className="block truncate text-sm font-medium text-foreground hover:underline"
                    >
                      {targetFisherfolk.fullName}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {targetFisherfolk.idNumber}
                    </p>
                    <StatusBadge status={targetFisherfolk.status} />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="ID Number" value={targetFisherfolk.idNumber} />
                  <Field
                    label="RSBSA Number"
                    value={targetFisherfolk.rsbsaNumber}
                  />
                  <Field label="Status" value={targetFisherfolk.status} />
                  <Field label="Sex" value={targetFisherfolk.sex} />
                  <Field
                    label="Civil Status"
                    value={targetFisherfolk.civilStatus}
                  />
                  <Field
                    label="Date of Birth"
                    value={formatDate(targetFisherfolk.dateOfBirth)}
                  />
                  <Field
                    label="Contact Number"
                    value={targetFisherfolk.contactNumber}
                  />
                  <Field label="Barangay" value={targetFisherfolk.barangay} />
                  <Field
                    label="Registration Year"
                    value={targetFisherfolk.registrationYear}
                  />
                </div>
              </div>
            ) : record.violatorName ? (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Violator (unregistered)
                </p>
                <p className="text-sm text-foreground">{record.violatorName}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No fisherfolk target.</p>
            )}

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Vessel
              </p>
              {targetVessel ? (
                <Link
                  href={`/${params.tenant}/vessels/${targetVessel.id}`}
                  className="flex items-center justify-between gap-2 hover:underline"
                >
                  <span className="text-sm font-medium text-foreground">
                    {targetVessel.vesselName ?? targetVessel.mfvrNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {targetVessel.mfvrNumber}
                  </span>
                </Link>
              ) : (
                <p className="text-sm text-foreground">—</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Violation Details — beside the profile, right side */}
        <Card>
          <CardHeader>
            <CardTitle>Violation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Subject" value={record.subject} />
              <Field label="Status" value={record.status} />
              <Field label="Target Type" value={record.targetType} />
              <Field label="Filed By" value={record.filedBy?.name} />
              <Field label="Date Filed" value={formatDate(record.createdAt)} />
            </div>
            <Separator />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Details" value={record.details} />
              <Field label="Notes" value={record.notes} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence — full width at the bottom */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {record.evidenceImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {record.evidenceImages.map((key) => (
                <EvidenceImage key={key} imageKey={key} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No evidence images.</p>
          )}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Attached Files
            </p>
            <AttachmentList
              attachments={record.attachments}
              emptyText="No evidence files."
            />
          </div>
        </CardContent>
      </Card>

      {record.status === "LIFTED" && (
        <Card>
          <CardHeader>
            <CardTitle>Resolution</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Lifted By" value={record.liftedBy?.name} />
            <Field label="Lifted At" value={formatDate(record.liftedAt)} />
            <Field label="Resolution Notes" value={record.resolutionNotes} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
