"use client";

import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { trpc } from "@/lib/trpc/client";

// ── AnnualResetCard component ─────────────────────────────────────────────────
// Admin-only control for the existing `dashboard.resetAnnualRegistrations`
// mutation. Bulk-sets every currently-registered fisherfolk (NEW/RENEWED) to
// EXPIRED, flagging them for individual renewal. Deferred, once-per-election
// action — intended to run once after a mayoral election, not on a fixed
// annual cadence. Idempotent — safe to run more than once.
export function AnnualResetCard() {
  const utils = trpc.useUtils();

  const resetMutation = trpc.dashboard.resetAnnualRegistrations.useMutation({
    onSuccess: (result) => {
      void utils.dashboard.invalidate();
      if (result.count === 0) {
        toast.success("No registrations needed to be flagged for renewal.");
      } else {
        toast.success(
          `Reset complete — ${result.count} fisherfolk flagged as expired, pending individual renewal.`,
        );
      }
    },
    onError: (err) => {
      toast.error(err.message ?? "Annual reset failed.");
    },
  });

  return (
    <Card className="border-destructive/30">
      <CardHeader className="border-b px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Annual Registration Reset
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div className="max-w-prose space-y-1.5">
          <p className="text-xs text-muted-foreground">
            Bulk-sets every currently-registered fisherfolk (New/Renewed) to
            Expired, flagging each one for individual renewal. Already-expired
            or archived fisherfolk are unaffected. This can be run again
            safely.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Deferred action — run once after a mayoral election, not on a
            fixed schedule. Each fisherfolk is renewed individually
            afterward.
          </p>
        </div>
        <ConfirmDialog
          variant="destructive"
          trigger={<Button variant="destructive" size="sm">Run Annual Reset</Button>}
          title="Run annual registration reset?"
          description={`This bulk-sets every currently-registered fisherfolk (New/Renewed) to Expired, flagging each one for individual renewal. Already-expired or archived fisherfolk are unaffected. This can be run again safely. Intended to run once after a mayoral election.`}
          confirmLabel="Yes, reset registrations"
          cancelLabel="Cancel"
          onConfirm={async () => {
            await resetMutation.mutateAsync();
          }}
        />
      </CardContent>
    </Card>
  );
}
