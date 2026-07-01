"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowRight, CheckCircle2, Printer, Search, Users, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ID_CARD_GEOMETRY } from "@frms/shared/schemas";
import { trpc } from "@/lib/trpc/client";

// ─── Exported types (consumed by S6 PvcSheetLayout) ──────────────────────────

export interface PrintSubject {
  subjectId: string;
  subjectType: "FISHERFOLK" | "VESSEL";
  registrationType: "NEW" | "RENEWED" | "UPDATE";
  name: string;
}

export interface PrintSelection {
  templateId: string;
  templateName: string;
  templateType: "FISHERFOLK" | "VESSEL";
  subjects: PrintSubject[];
}

interface SelectAndPrintProps {
  onProceedToLayout: (selection: PrintSelection) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** How many 200×300mm PVC sheets are needed (4 IDs per sheet). */
function sheetsNeeded(count: number): number {
  return count === 0 ? 0 : Math.ceil(count / ID_CARD_GEOMETRY.maxPairsPerSheet);
}

function derivedRegType(renewalCount: number): "NEW" | "RENEWED" {
  return renewalCount === 0 ? "NEW" : "RENEWED";
}

// ─── Fisherfolk subject table ─────────────────────────────────────────────────

interface FisherfolkSubjectTableProps {
  templateId: string | null;
  templateName: string;
  onProceedToLayout: (selection: PrintSelection) => void;
}

function FisherfolkSubjectTable({
  templateId,
  templateName,
  onProceedToLayout,
}: FisherfolkSubjectTableProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds(new Set());
  }, [templateId]);

  const { data: eligible = [], isLoading } = trpc.idPrint.listEligible.useQuery(
    { templateType: "FISHERFOLK", search: search || undefined },
    { enabled: !!templateId },
  );

  const readySubjects = useMemo(() => eligible.filter((s) => s.ready), [eligible]);

  const selectedSubjects = useMemo(
    () => eligible.filter((s) => selectedIds.has(s.id) && s.ready),
    [eligible, selectedIds],
  );

  function toggleId(id: string, ready: boolean) {
    if (!ready) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllReady() {
    setSelectedIds(new Set(readySubjects.map((s) => s.id)));
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  function handleProceed() {
    if (!templateId || selectedSubjects.length === 0) return;
    onProceedToLayout({
      templateId,
      templateName,
      templateType: "FISHERFOLK",
      subjects: selectedSubjects.map((s) => ({
        subjectId: s.id,
        subjectType: "FISHERFOLK" as const,
        registrationType: derivedRegType(s.renewalCount),
        name: s.name ?? "",
      })),
    });
  }

  const sheets = sheetsNeeded(selectedSubjects.length);

  return (
    <div className="space-y-4">
      {/* Search + bulk controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search
            className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="fisherfolk-search"
            placeholder="Search by name or ID…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search fisherfolk by name or registration ID"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={selectAllReady}
          disabled={readySubjects.length === 0}
          aria-label={`Select all ${readySubjects.length} ready subjects`}
        >
          Select all ready ({readySubjects.length})
        </Button>
        {selectedIds.size > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearAll}
            aria-label="Clear current selection"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Subject table */}
      {!templateId ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Select a template above to view eligible subjects.
        </p>
      ) : isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground" role="status">
          Loading subjects…
        </p>
      ) : eligible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No subjects found.</p>
      ) : (
        <div className="overflow-auto rounded-md border">
          <Table>
            <caption className="sr-only">
              Fisherfolk eligible for ID printing. Check rows to add to the print queue.
              Rows marked as incomplete cannot be selected.
            </caption>
            <TableHeader>
              <TableRow>
                <TableHead
                  scope="col"
                  className="w-10"
                  aria-label="Row selection checkbox"
                />
                <TableHead scope="col">Name</TableHead>
                <TableHead scope="col">Photo</TableHead>
                <TableHead scope="col">Signature</TableHead>
                <TableHead scope="col">ID Released</TableHead>
                <TableHead scope="col">Registration</TableHead>
                <TableHead scope="col">Print Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligible.map((subject) => {
                const isSelected = selectedIds.has(subject.id);
                const blocked = !subject.ready;
                const missing: string[] = [];
                if (!subject.photo) missing.push("photo");
                if (!subject.signature) missing.push("signature");
                const missingText = missing.join(" and ");

                return (
                  <TableRow
                    key={subject.id}
                    data-state={isSelected ? "selected" : undefined}
                    aria-selected={isSelected}
                    className={blocked ? "opacity-60" : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        id={`select-${subject.id}`}
                        checked={isSelected}
                        disabled={blocked}
                        onCheckedChange={() => toggleId(subject.id, subject.ready)}
                        aria-label={
                          blocked
                            ? `${subject.name} — blocked: missing ${missingText}`
                            : `Select ${subject.name} for printing`
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <label
                        htmlFor={`select-${subject.id}`}
                        className={
                          blocked ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"
                        }
                      >
                        {subject.name}
                      </label>
                    </TableCell>
                    <TableCell>
                      {subject.photo !== null ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                          <img
                            src={subject.photo}
                            alt={`Photo thumbnail for ${subject.name}`}
                            className="h-8 w-8 rounded border object-cover"
                          />
                          <span className="sr-only">Photo present</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive">
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          Missing
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {subject.signature !== null ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive">
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          Missing
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {subject.idReleasedAt !== null ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-600 text-xs text-emerald-700 dark:text-emerald-400"
                        >
                          Released
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Not Released
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {subject.renewalCount > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-orange-500 text-xs text-orange-700 dark:text-orange-400"
                        >
                          RENEWED
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-600 text-xs text-emerald-700 dark:text-emerald-400"
                        >
                          NEW
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {blocked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                          <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                          Missing {missingText}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                          Ready
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Selection summary + Proceed action */}
      {selectedSubjects.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
          <p className="text-sm">
            <span className="font-semibold">{selectedSubjects.length}</span>{" "}
            subject{selectedSubjects.length !== 1 ? "s" : ""} selected
            {" · "}
            <span className="font-semibold">{sheets}</span>{" "}
            sheet{sheets !== 1 ? "s" : ""} needed
          </p>
          <Button
            onClick={handleProceed}
            className="gap-2"
            aria-label={`Proceed to layout with ${selectedSubjects.length} selected subjects on ${sheets} sheet${sheets !== 1 ? "s" : ""}`}
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Proceed to Layout
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main SelectAndPrint component ───────────────────────────────────────────

export function SelectAndPrint({ onProceedToLayout }: SelectAndPrintProps) {
  const [activeTab, setActiveTab] = useState<"FISHERFOLK" | "VESSEL">("FISHERFOLK");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const { data: allTemplates = [] } = trpc.idTemplate.list.useQuery();

  const activeTemplates = useMemo(
    () => allTemplates.filter((t) => t.templateType === activeTab && t.status === "ACTIVE"),
    [allTemplates, activeTab],
  );

  const selectedTemplate = useMemo(
    () => allTemplates.find((t) => t.id === selectedTemplateId) ?? null,
    [allTemplates, selectedTemplateId],
  );

  function handleTabChange(value: string) {
    setActiveTab(value as "FISHERFOLK" | "VESSEL");
    setSelectedTemplateId(null);
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="FISHERFOLK">
            <Users className="mr-2 h-4 w-4" aria-hidden="true" />
            Fisherfolk IDs
          </TabsTrigger>
          <TabsTrigger value="VESSEL" aria-label="Vessel IDs — coming soon">
            Vessel IDs
            <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
              Coming soon
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Fisherfolk tab ── */}
        <TabsContent value="FISHERFOLK" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor="template-select" className="shrink-0 font-medium">
              Template:
            </Label>
            {activeTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active fisherfolk templates found. Create and activate one in the Template
                Editor first.
              </p>
            ) : (
              <Select
                value={selectedTemplateId ?? ""}
                onValueChange={(v) => setSelectedTemplateId(v || null)}
              >
                <SelectTrigger
                  id="template-select"
                  className="w-72"
                  aria-label="Select ID card template for printing"
                >
                  <SelectValue placeholder="Select a template…" />
                </SelectTrigger>
                <SelectContent>
                  {activeTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <FisherfolkSubjectTable
            templateId={selectedTemplateId}
            templateName={selectedTemplate?.name ?? ""}
            onProceedToLayout={onProceedToLayout}
          />
        </TabsContent>

        {/* ── Vessel tab — coming soon ── */}
        <TabsContent value="VESSEL" className="mt-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                {/* Inline ship icon — lucide ShipIcon not available in this build */}
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 20h18M5 20l2-8h10l2 8M12 12V4m0 0l-3 3m3-3l3 3"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Vessel ID printing — coming soon</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vessel ID card printing is not yet available in this wave. Fisherfolk IDs are
                  fully functional.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
