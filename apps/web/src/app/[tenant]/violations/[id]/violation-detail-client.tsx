"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
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
    // eslint-disable-next-line @next/next/no-img-element
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
          <StatusBadge status={record.status} />
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Violation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Subject" value={record.subject} />
              <Field label="Details" value={record.details} />
              <Field label="Notes" value={record.notes} />
            </CardContent>
          </Card>

          {/* Target */}
          <Card>
            <CardHeader>
              <CardTitle>Target</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Target Type" value={record.targetType} />
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Fisherfolk
                </p>
                {targetFisherfolk ? (
                  <Link
                    href={`/${params.tenant}/fisherfolk/${targetFisherfolk.id}`}
                    className="flex items-center justify-between gap-2 hover:underline"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {targetFisherfolk.fullName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {targetFisherfolk.idNumber}
                    </span>
                  </Link>
                ) : (
                  <p className="text-sm text-foreground">—</p>
                )}
              </div>
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

          {/* Evidence */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              {record.evidenceImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {record.evidenceImages.map((key) => (
                    <EvidenceImage key={key} imageKey={key} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No evidence images.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Status" value={record.status} />
              <Field label="Filed By" value={record.filedBy?.name} />
              <Field label="Date Filed" value={formatDate(record.createdAt)} />
            </CardContent>
          </Card>

          {record.status === "LIFTED" && (
            <Card>
              <CardHeader>
                <CardTitle>Resolution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Lifted By" value={record.liftedBy?.name} />
                <Field label="Lifted At" value={formatDate(record.liftedAt)} />
                <Field
                  label="Resolution Notes"
                  value={record.resolutionNotes}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
