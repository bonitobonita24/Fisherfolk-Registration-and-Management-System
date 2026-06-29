"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import type { ValidationReport } from "@/lib/import/validate";
import { Stepper } from "@/components/shared";

// ── Types ─────────────────────────────────────────────────────────────────────
type WizardStep = "upload" | "preview" | "done";
type ImportMode = "FULL" | "INCREMENTAL";

interface CommitResult {
  imported: number;
  skipped: number;
  updated: number;
  batchId: string;
}

// ── Stepper config ─────────────────────────────────────────────────────────────
const STEP_LABELS = ["Upload", "Preview", "Done"];
const STEP_INDEX: Record<"upload" | "preview" | "done", number> = { upload: 0, preview: 1, done: 2 };

// ── Badge variant helpers ──────────────────────────────────────────────────────
function statusBadgeVariant(
  status: "valid" | "warning" | "error",
): "default" | "secondary" | "destructive" {
  if (status === "valid") return "default";
  if (status === "warning") return "secondary";
  return "destructive";
}

// ── Main component ────────────────────────────────────────────────────────────
export function ImportWizard() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>("upload");
  const [mode, setMode] = useState<ImportMode>("FULL");
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const parseWorkbook = trpc.import.parseWorkbook.useMutation();
  const preview = trpc.import.preview.useMutation();
  const commit = trpc.import.commit.useMutation();

  // ── Recent imports query ──────────────────────────────────────────────────
  const { data: batches, refetch: refetchBatches } =
    trpc.import.listBatches.useQuery();

  // ── Loading state: true while parse+preview pipeline is running ────────────
  const isProcessing = parseWorkbook.isPending || preview.isPending;

  // ── File select handler ───────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl !== "string") return;

      // Strip the data:...;base64, prefix
      const base64 = dataUrl.split(",")[1];
      if (!base64) {
        toast.error("Could not read the selected file.");
        return;
      }

      try {
        // Step 1: server-side parse
        const parsed = await parseWorkbook.mutateAsync({ fileBase64: base64 });

        if (parsed.headerWarnings.length > 0) {
          toast.warning(
            `Header warnings: ${parsed.headerWarnings.join("; ")}`,
            { duration: 8000 },
          );
        }

        const parsedFileName = file.name;
        const parsedRows = parsed.rows;

        // Step 2: preview / validate
        const previewResult = await preview.mutateAsync({
          fileName: parsedFileName,
          rows: parsedRows,
          mode,
        });

        setFileName(parsedFileName);
        setRows(parsedRows);
        setReport(previewResult.report);
        setBatchId(previewResult.batchId);
        setStep("preview");
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to process the file. Please try again.",
        );
      }
    };

    reader.readAsDataURL(file);
  }

  // ── Commit handler ────────────────────────────────────────────────────────
  async function handleCommit() {
    if (!batchId) return;

    try {
      const result = await commit.mutateAsync({ batchId, rows, mode });
      setCommitResult(result);
      setStep("done");
      const parts = [`${result.imported.toLocaleString()} imported`];
      if (result.updated > 0) parts.push(`${result.updated.toLocaleString()} updated`);
      if (result.skipped > 0) parts.push(`${result.skipped.toLocaleString()} skipped`);
      toast.success(`Import complete — ${parts.join(" · ")}.`);
      void refetchBatches();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Import failed. Please try again.",
      );
    }
  }

  // ── Reset handler ─────────────────────────────────────────────────────────
  function handleReset() {
    setStep("upload");
    setFileName("");
    setRows([]);
    setReport(null);
    setBatchId(null);
    setCommitResult(null);
    parseWorkbook.reset();
    preview.reset();
    commit.reset();
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <Stepper steps={STEP_LABELS} current={STEP_INDEX[step]} className="mb-2" />

      {/* ── Upload step ───────────────────────────────────────────────────── */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Spreadsheet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ── Mode selector ─────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label>Import mode</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === "FULL" ? "default" : "outline"}
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => setMode("FULL")}
                >
                  Full import
                </Button>
                <Button
                  type="button"
                  variant={mode === "INCREMENTAL" ? "default" : "outline"}
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => setMode("INCREMENTAL")}
                >
                  Incremental update
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {mode === "FULL"
                  ? "New records are added; existing records with the same ID are skipped."
                  : "Existing records with the same ID are updated; new records are added."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="import-file">
                Select file (.xlsx, .xls, .csv)
              </Label>
              <Input
                id="import-file"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                disabled={isProcessing}
                onChange={(e) => handleFileChange(e)}
              />
            </div>
            {isProcessing && (
              <p className="text-sm text-muted-foreground animate-pulse">
                {parseWorkbook.isPending
                  ? "Parsing file…"
                  : "Validating records…"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Preview step ──────────────────────────────────────────────────── */}
      {step === "preview" && report !== null && (
        <div className="space-y-4">
          {/* Summary card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Validation Preview — {fileName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCell
                  label="Total rows"
                  value={report.counts.total}
                  variant="outline"
                />
                <StatCell
                  label="Valid"
                  value={report.counts.valid}
                  variant="default"
                />
                <StatCell
                  label="Warnings"
                  value={report.counts.warning}
                  variant="secondary"
                />
                <StatCell
                  label="Errors"
                  value={report.counts.error}
                  variant="destructive"
                />
                <StatCell
                  label="To import"
                  value={report.counts.toImport}
                  variant="default"
                />
                <StatCell
                  label={mode === "INCREMENTAL" ? "Will update" : "To skip"}
                  value={report.counts.toSkip}
                  variant={mode === "INCREMENTAL" ? "default" : "secondary"}
                />
                <StatCell
                  label="Duplicates"
                  value={report.counts.duplicates}
                  variant="secondary"
                />
                <StatCell
                  label="ID collisions"
                  value={report.counts.collisions}
                  variant="destructive"
                />
              </div>

              {/* Collision list */}
              {report.collisions.length > 0 && (
                <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm space-y-1">
                  <p className="font-semibold text-destructive">
                    ID Collisions detected — these rows share the same ID number
                    and only the first will be imported:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-destructive/80">
                    {report.collisions.map((c) => (
                      <li key={c.idNumber}>
                        <span className="font-mono">{c.idNumber}</span> — rows{" "}
                        {c.rows.map((r) => r + 1).join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" onClick={handleReset}>
                  Back
                </Button>
                {(() => {
                  const committable =
                    mode === "INCREMENTAL"
                      ? report.counts.toImport + report.counts.toSkip
                      : report.counts.toImport;
                  return (
                    <Button
                      onClick={() => void handleCommit()}
                      disabled={committable === 0 || commit.isPending}
                    >
                      {commit.isPending
                        ? "Importing…"
                        : mode === "INCREMENTAL"
                          ? `Import / update ${committable.toLocaleString()} records`
                          : `Import ${committable.toLocaleString()} records`}
                    </Button>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Row preview table — first 100 rows */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Row Preview{" "}
                <span className="text-muted-foreground font-normal text-sm">
                  (first {Math.min(report.rows.length, 100)} of{" "}
                  {report.rows.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Barangay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.slice(0, 100).map((row) => {
                    const issues = [...row.warnings, ...row.errors].join("; ");
                    return (
                      <TableRow key={row.rowIndex}>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {row.rowIndex + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.idNumber}
                        </TableCell>
                        <TableCell>{row.normalized.fullName}</TableCell>
                        <TableCell>
                          {row.normalized.barangay ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(row.status)}>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {issues || (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Done step ─────────────────────────────────────────────────────── */}
      {step === "done" && commitResult !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import Complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCell
                label="Imported"
                value={commitResult.imported}
                variant="default"
              />
              {commitResult.updated > 0 && (
                <StatCell
                  label="Updated"
                  value={commitResult.updated}
                  variant="default"
                />
              )}
              <StatCell
                label="Skipped"
                value={commitResult.skipped}
                variant="secondary"
              />
            </div>
            <Button variant="outline" onClick={handleReset}>
              Import another file
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Recent imports (always visible) ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Imports</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {!batches || batches.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No imports yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Imported</TableHead>
                  <TableHead>Skipped</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="text-xs font-mono max-w-xs truncate">
                      {batch.fileName ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          batch.status === "COMPLETED"
                            ? "default"
                            : batch.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {batch.totalRows ?? 0}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {batch.importedRows ?? 0}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {batch.skippedRows ?? 0}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(batch.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── StatCell sub-component ────────────────────────────────────────────────────
function StatCell({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Badge variant={variant === "outline" ? "secondary" : variant}>
        {value.toLocaleString()}
      </Badge>
    </div>
  );
}
