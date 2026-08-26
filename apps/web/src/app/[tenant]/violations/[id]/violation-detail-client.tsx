"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
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
import { RecordHeader, DetailField, DefinitionGrid } from "@/components/shared";

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
  const tenantHref = useTenantHref();

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
          <Link href={tenantHref("/violations")}>
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
    <div className="space-y-4 pb-4">
      <RecordHeader
        backHref={tenantHref("/violations")}
        backLabel="Back to violations"
        title={record.subject}
        meta={`Filed ${formatDate(record.createdAt)}`}
        badge={
          <StatusBadge
            status={record.status}
            color={record.status === "ACTIVE" ? "red" : "green"}
          />
        }
        actions={
          <>
            {canManage && (
              <MakeTodoDialog
                sourceEntityType="violation"
                sourceEntityId={id}
                defaultTitle={`Follow up: ${record.subject}`}
              />
            )}
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
          </>
        }
      />

      {/* Top row: violator profile (left) beside Violation Details (right) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile — full violator details with picture */}
        <Card className="gap-0 py-5">
          <CardHeader className="px-6 pb-4 pt-0">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-0">
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
                      href={tenantHref(`/fisherfolk/${targetFisherfolk.id}`)}
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
                <DefinitionGrid columns={3}>
                  <DetailField label="ID Number" value={targetFisherfolk.idNumber} />
                  <DetailField
                    label="RSBSA Number"
                    value={targetFisherfolk.rsbsaNumber}
                  />
                  <DetailField label="Status" value={targetFisherfolk.status} />
                  <DetailField label="Sex" value={targetFisherfolk.sex} />
                  <DetailField
                    label="Civil Status"
                    value={targetFisherfolk.civilStatus}
                  />
                  <DetailField
                    label="Date of Birth"
                    value={formatDate(targetFisherfolk.dateOfBirth)}
                  />
                  <DetailField
                    label="Contact Number"
                    value={targetFisherfolk.contactNumber}
                  />
                  <DetailField label="Barangay" value={targetFisherfolk.barangay} />
                  <DetailField
                    label="Registration Year"
                    value={targetFisherfolk.registrationYear}
                  />
                </DefinitionGrid>
              </div>
            ) : record.violatorName ? (
              <DetailField
                label="Violator (unregistered)"
                value={record.violatorName}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No fisherfolk target.</p>
            )}

            <DetailField
              label="Vessel"
              value={
                targetVessel ? (
                  <Link
                    href={tenantHref(`/vessels/${targetVessel.id}`)}
                    className="flex items-center justify-between gap-2 hover:underline"
                  >
                    <span className="font-medium text-foreground">
                      {targetVessel.vesselName ?? targetVessel.mfvrNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {targetVessel.mfvrNumber}
                    </span>
                  </Link>
                ) : undefined
              }
            />
          </CardContent>
        </Card>

        {/* Violation Details — beside the profile, right side */}
        <Card className="gap-0 py-5">
          <CardHeader className="px-6 pb-4 pt-0">
            <CardTitle className="text-sm font-medium">Violation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-0">
            <DefinitionGrid columns={3}>
              <DetailField label="Subject" value={record.subject} />
              <DetailField label="Status" value={record.status} />
              <DetailField label="Target Type" value={record.targetType} />
              <DetailField label="Filed By" value={record.filedBy?.name} />
              <DetailField label="Date Filed" value={formatDate(record.createdAt)} />
            </DefinitionGrid>
            <Separator />
            {/* Narrative fields — full width, never squeezed into the grid */}
            <DetailField label="Details" value={record.details} />
            <DetailField label="Notes" value={record.notes} />
          </CardContent>
        </Card>
      </div>

      {/* Evidence — full width at the bottom */}
      <Card className="gap-0 py-5">
        <CardHeader className="px-6 pb-4 pt-0">
          <CardTitle className="text-sm font-medium">Evidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 py-0">
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
            <p className="text-xs text-muted-foreground">Attached Files</p>
            <AttachmentList
              attachments={record.attachments}
              emptyText="No evidence files."
            />
          </div>
        </CardContent>
      </Card>

      {/* Linked ToDos */}
      <LinkedTodos sourceEntityType="violation" sourceEntityId={id} />

      {record.status === "LIFTED" && (
        <Card className="gap-0 py-5">
          <CardHeader className="px-6 pb-4 pt-0">
            <CardTitle className="text-sm font-medium">Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-0">
            <DefinitionGrid columns={2}>
              <DetailField label="Lifted By" value={record.liftedBy?.name} />
              <DetailField label="Lifted At" value={formatDate(record.liftedAt)} />
            </DefinitionGrid>
            {/* Narrative field — full width */}
            <DetailField label="Resolution Notes" value={record.resolutionNotes} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
