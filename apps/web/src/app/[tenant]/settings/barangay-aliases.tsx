"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

// ── BarangayAliases component ─────────────────────────────────────────────────
export function BarangayAliases() {
  const [fromLabel, setFromLabel] = useState("");
  const [toLabel, setToLabel] = useState("");

  const utils = trpc.useUtils();

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: aliases, isLoading: aliasesLoading } =
    trpc.settings.barangayAlias.listAliases.useQuery();

  const { data: barangayList } =
    trpc.settings.barangayAlias.barangayList.useQuery();

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createAlias = trpc.settings.barangayAlias.createAlias.useMutation({
    onSuccess: () => {
      void utils.settings.barangayAlias.listAliases.invalidate();
      setFromLabel("");
      setToLabel("");
      toast.success("Alias saved.");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to save alias.");
    },
  });

  const deleteAlias = trpc.settings.barangayAlias.deleteAlias.useMutation({
    onSuccess: () => {
      void utils.settings.barangayAlias.listAliases.invalidate();
      toast.success("Alias deleted.");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to delete alias.");
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleAdd() {
    if (!fromLabel.trim() || !toLabel) return;
    createAlias.mutate({ fromLabel: fromLabel.trim(), toLabel });
  }

  function handleDelete(id: string) {
    deleteAlias.mutate({ id });
  }

  const addDisabled =
    !fromLabel.trim() || !toLabel || createAlias.isPending;

  return (
    <FormSection
      title="Barangay Aliases"
      description="Maps common misspellings or variants of a barangay name to the canonical name, applied automatically during data import."
    >
      <div className="space-y-6">
        {/* ── Add form row ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px] space-y-1.5">
            <Label htmlFor="alias-from">Variant / typo</Label>
            <Input
              id="alias-from"
              placeholder="e.g. Nag iba 2"
              value={fromLabel}
              onChange={(e) => setFromLabel(e.target.value)}
              disabled={createAlias.isPending}
              className="h-9"
            />
          </div>
          <div className="flex-1 min-w-[180px] space-y-1.5">
            <Label htmlFor="alias-to">Canonical barangay</Label>
            <Select
              value={toLabel}
              onValueChange={setToLabel}
              disabled={createAlias.isPending}
            >
              <SelectTrigger id="alias-to" className="h-9">
                <SelectValue placeholder="Select canonical name" />
              </SelectTrigger>
              <SelectContent className="w-60">
                {(barangayList ?? []).map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={addDisabled}>
            {createAlias.isPending ? "Adding…" : "Add"}
          </Button>
        </div>

        {/* ── Aliases table ────────────────────────────────────────────────── */}
        {aliasesLoading ? (
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading aliases…
          </p>
        ) : !aliases || aliases.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No aliases configured yet. Add one above.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">
                    From (variant / typo)
                  </TableHead>
                  <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">
                    To (canonical)
                  </TableHead>
                  <TableHead className="w-12 border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {aliases.map((alias) => (
                  <TableRow key={alias.id}>
                    <TableCell className="border-r px-3 py-2 font-mono text-sm last:border-r-0">
                      {alias.fromLabel}
                    </TableCell>
                    <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
                      {alias.toLabel}
                    </TableCell>
                    <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete alias ${alias.fromLabel}`}
                        disabled={deleteAlias.isPending}
                        onClick={() => handleDelete(alias.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </FormSection>
  );
}
