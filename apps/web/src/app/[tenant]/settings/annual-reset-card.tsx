"use client";

import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { trpc } from "@/lib/trpc/client";

interface AnnualResetCardProps {
  currentYear: number;
}

// ── AnnualResetCard component ─────────────────────────────────────────────────
// Admin-only control for the existing `dashboard.resetAnnualRegistrations`
// mutation. Marks ACTIVE/RENEWED fisherfolk from prior registration years as
// INACTIVE, closing out the current registration cycle. Idempotent — safe to
// run more than once.
export function AnnualResetCard({ currentYear }: AnnualResetCardProps) {
  const utils = trpc.useUtils();

  const resetMutation = trpc.dashboard.resetAnnualRegistrations.useMutation({
    onSuccess: (result) => {
      void utils.dashboard.invalidate();
      if (result.count === 0) {
        toast.success("No prior-year registrations needed resetting.");
      } else {
        toast.success(
          `Annual reset complete — ${result.count} fisherfolk marked inactive.`,
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
        <p className="text-xs text-muted-foreground max-w-prose">
          Marks every fisherfolk still registered under a previous year as
          Inactive, closing out the {currentYear} registration cycle.
          Fisherfolk registered for the current year are unaffected. This can
          be run again safely.
        </p>
        <ConfirmDialog
          variant="destructive"
          trigger={<Button variant="destructive" size="sm">Run Annual Reset</Button>}
          title="Run annual registration reset?"
          description={`This marks every fisherfolk still registered under a year before ${currentYear} as Inactive, closing out the ${currentYear} registration cycle. Fisherfolk already registered for ${currentYear} are unaffected. This action can be run again safely.`}
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
