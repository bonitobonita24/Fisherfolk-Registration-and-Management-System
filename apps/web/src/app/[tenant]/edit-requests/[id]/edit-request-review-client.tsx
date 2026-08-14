"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RecordHeader } from "@/components/shared";
import { StatusBadge } from "@/components/shared/status-badge";

interface Props {
  id: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatDatetime(value: Date | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length === 0 ? "—" : value.join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  // value is string | number | bigint | symbol at this point — convert each explicitly
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number") return value.toString();
  // string
  return value as string;
}

// ── DiffRow ───────────────────────────────────────────────────────────────────

function DiffRow({
  fieldKey,
  oldValue,
  newValue,
}: {
  fieldKey: string;
  oldValue: unknown;
  newValue: unknown;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="w-1/4 py-3 pr-4 align-top">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {humanizeKey(fieldKey)}
        </span>
      </td>
      <td className="w-3/8 py-3 pr-4 align-top">
        <span className="text-sm text-destructive line-through">
          {displayValue(oldValue)}
        </span>
      </td>
      <td className="w-3/8 py-3 align-top">
        <span className="rounded bg-emerald-50 px-1 py-0.5 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          {displayValue(newValue)}
        </span>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EditRequestReviewClient({ id }: Props) {
  const params = useParams<{ tenant: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  // ── queries ────────────────────────────────────────────────────────────────

  const {
    data: request,
    isLoading: requestLoading,
    isError: requestError,
    error: requestErr,
  } = trpc.editRequest.getById.useQuery({ id });

  const fisherfolkId = request?.fisherfolk?.id;

  const { data: fisherfolk, isLoading: fisherfolkLoading } =
    trpc.fisherfolk.getById.useQuery(
      { id: fisherfolkId ?? "" },
      { enabled: !!fisherfolkId },
    );

  const { data: historyData } = trpc.editRequest.history.useQuery(
    { fisherfolkId: fisherfolkId ?? "" },
    { enabled: !!fisherfolkId },
  );

  // ── mutations ──────────────────────────────────────────────────────────────

  const approveMutation = trpc.editRequest.approve.useMutation({
    onSuccess: async () => {
      toast.success("Edit request approved.");
      await utils.editRequest.list.invalidate();
      router.push(`/${params.tenant}/edit-requests`);
    },
    onError: (err) => {
      toast.error(`Approval failed: ${err.message}`);
    },
  });

  const rejectMutation = trpc.editRequest.reject.useMutation({
    onSuccess: async () => {
      toast.success("Edit request rejected.");
      setRejectOpen(false);
      await utils.editRequest.list.invalidate();
      router.push(`/${params.tenant}/edit-requests`);
    },
    onError: (err) => {
      toast.error(`Rejection failed: ${err.message}`);
    },
  });

  // ── loading / error states ─────────────────────────────────────────────────

  if (requestLoading || fisherfolkLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading edit request…</p>
    );
  }

  if (requestError) {
    const notFound = requestErr?.data?.code === "NOT_FOUND";
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${params.tenant}/edit-requests`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {notFound
                ? "Edit request not found."
                : "Failed to load edit request."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request || !fisherfolk) return null;

  const fieldChanges = request.fieldChanges as Record<string, unknown>;
  const isPending = request.status === "PENDING";

  // Prior REJECTED requests for this fisherfolk (excluding current)
  const priorRejections = (historyData?.items ?? []).filter(
    (h) => h.status === "REJECTED" && h.id !== id,
  );

  // ── reject dialog handlers ─────────────────────────────────────────────────

  function handleOpenReject() {
    setRejectionReason("");
    setReasonError("");
    setRejectOpen(true);
  }

  function handleConfirmReject() {
    if (!rejectionReason.trim()) {
      setReasonError("Rejection reason is required.");
      return;
    }
    rejectMutation.mutate({ id, rejectionReason: rejectionReason.trim() });
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <RecordHeader
        backHref={`/${params.tenant}/edit-requests`}
        backLabel="Back to edit requests"
        title="Edit Request Review"
        meta={
          <>
            Requested by {request.requestedBy?.name ?? "—"} on{" "}
            {formatDatetime(request.createdAt)}
          </>
        }
        badge={<StatusBadge status={request.status} />}
      />

      {/* Fisherfolk info card */}
      <Card>
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="text-sm font-medium">Fisherfolk</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <Link
            href={`/${params.tenant}/fisherfolk/${fisherfolk.id}`}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {fisherfolk.fullName}
          </Link>
          <p className="text-xs text-muted-foreground">{fisherfolk.idNumber}</p>
        </CardContent>
      </Card>

      {/* Diff table */}
      <Card>
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="text-sm font-medium">Proposed Changes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-6 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Field
                </th>
                <th className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-destructive">
                  Current (Old)
                </th>
                <th className="pb-2 text-left text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  Proposed (New)
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(fieldChanges).map(([key, newVal]) => (
                <DiffRow
                  key={key}
                  fieldKey={key}
                  oldValue={(fisherfolk as Record<string, unknown>)[key]}
                  newValue={newVal}
                />
              ))}
            </tbody>
          </table>
          {Object.keys(fieldChanges).length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No field changes recorded.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action buttons (PENDING only) */}
      {isPending && (
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => approveMutation.mutate({ id })}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleOpenReject}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
      )}

      {/* Verdict (non-PENDING) */}
      {!isPending && (
        <Card>
          <CardHeader className="border-b px-6 py-5">
            <CardTitle className="text-sm font-medium">Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-6 py-5 text-sm">
            <p>
              <span className="font-medium">Reviewed by:</span>{" "}
              {request.reviewedBy?.name ?? "—"}
            </p>
            <p>
              <span className="font-medium">Reviewed at:</span>{" "}
              {formatDatetime(request.reviewedAt)}
            </p>
            {request.status === "REJECTED" && request.rejectionReason && (
              <p>
                <span className="font-medium">Rejection reason:</span>{" "}
                {request.rejectionReason}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rejection history (PD-004) */}
      {priorRejections.length > 0 && (
        <>
          <Separator />
          <Card>
            <CardHeader className="border-b px-6 py-5">
              <CardTitle className="text-sm font-medium">
                Prior Rejection History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-6 py-5">
              {priorRejections.map((h) => (
                <div
                  key={h.id}
                  className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm"
                >
                  <p className="text-xs text-muted-foreground">
                    {formatDatetime(h.createdAt)} — fields:{" "}
                    {Object.keys(h.fieldChanges as Record<string, unknown>).join(
                      ", ",
                    )}
                  </p>
                  {h.rejectionReason && (
                    <p className="mt-1 text-destructive">
                      {h.rejectionReason}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Edit Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this request. The encoder will see
              this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="Enter rejection reason…"
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (reasonError) setReasonError("");
              }}
              rows={4}
            />
            {reasonError && (
              <p className="text-xs text-destructive">{reasonError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting…" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
