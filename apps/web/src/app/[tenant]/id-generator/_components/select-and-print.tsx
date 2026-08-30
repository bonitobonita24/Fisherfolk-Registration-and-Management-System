"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  ListToolbar,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "@/components/shared";
import { ID_CARD_GEOMETRY } from "@frms/shared/schemas";
import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";

// ─── Exported types (consumed by PvcSheet — Step 2) ──────────────────────────

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

// ─── Constants / helpers ──────────────────────────────────────────────────────

/** Hard cap: one PVC sheet = 4 ID pairs, and the print flow is one sheet per run. */
const MAX_SELECTION = ID_CARD_GEOMETRY.maxPairsPerSheet; // 4
const RECENT_LIMIT = 8;

function derivedRegType(renewalCount: number): "NEW" | "RENEWED" {
  return renewalCount === 0 ? "NEW" : "RENEWED";
}

function formatRegisteredDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Minimal slice of an eligible row that the selection needs to carry. */
interface SelectedSubject {
  id: string;
  name: string;
  renewalCount: number;
}

// ─── Fisherfolk selection step (Step 1) ───────────────────────────────────────

function FisherfolkSelectStep({
  onProceedToLayout,
}: {
  onProceedToLayout: (selection: PrintSelection) => void;
}) {
  const tenantHref = useTenantHref();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Map<string, SelectedSubject>>(
    new Map(),
  );

  // The active template is auto-loaded — encoders never pick a template.
  const activeTemplateQuery = trpc.idTemplate.getActive.useQuery(
    { templateType: "FISHERFOLK" },
    { retry: false },
  );
  const activeTemplate = activeTemplateQuery.data ?? null;
  const noActiveTemplate =
    activeTemplateQuery.isError || (!activeTemplateQuery.isLoading && !activeTemplate);

  // "Recently registered" quick-select — most recent first, tenant-scoped.
  const { data: recent = [], isLoading: recentLoading } =
    trpc.idPrint.listEligible.useQuery(
      { templateType: "FISHERFOLK", sort: "recent", limit: RECENT_LIMIT },
      { enabled: !!activeTemplate },
    );

  // Search across all fisherfolk (only when the encoder types something).
  const trimmedSearch = search.trim();
  const { data: searchResults = [], isLoading: searchLoading } =
    trpc.idPrint.listEligible.useQuery(
      { templateType: "FISHERFOLK", search: trimmedSearch },
      { enabled: !!activeTemplate && trimmedSearch.length > 0 },
    );

  const atMax = selected.size >= MAX_SELECTION;

  function toggle(subject: {
    id: string;
    name: string | null;
    renewalCount: number;
    ready: boolean;
  }) {
    if (!subject.ready) return;
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(subject.id)) {
        next.delete(subject.id);
      } else {
        if (next.size >= MAX_SELECTION) return prev; // hard cap
        next.set(subject.id, {
          id: subject.id,
          name: subject.name ?? "",
          renewalCount: subject.renewalCount,
        });
      }
      return next;
    });
  }

  function remove(id: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }

  function handleProceed() {
    if (!activeTemplate || selected.size === 0) return;
    onProceedToLayout({
      templateId: activeTemplate.id,
      templateName: activeTemplate.name,
      templateType: "FISHERFOLK",
      subjects: [...selected.values()].map((s) => ({
        subjectId: s.id,
        subjectType: "FISHERFOLK" as const,
        registrationType: derivedRegType(s.renewalCount),
        name: s.name,
      })),
    });
  }

  // ── No active template: dead-end with a pointer to Settings ──
  if (noActiveTemplate) {
    return (
      <div
        role="alert"
        className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm"
      >
        <p className="font-semibold">No active ID template</p>
        <p className="mt-1 text-muted-foreground">
          An administrator must design and activate a fisherfolk ID template in{" "}
          <Link
            href={tenantHref("/settings/id-template")}
            className="font-medium underline underline-offset-2"
          >
            Settings → ID Card Template
          </Link>{" "}
          before IDs can be printed.
        </p>
      </div>
    );
  }

  if (activeTemplateQuery.isLoading) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground" role="status">
        Loading active template…
      </p>
    );
  }

  const selectionRatio = `${selected.size}/${MAX_SELECTION}`;

  return (
    <div className="space-y-4">
      {/* Active template banner */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
        <CheckCircle2
          className="h-4 w-4 text-emerald-700 dark:text-emerald-400"
          aria-hidden="true"
        />
        <span>
          Using active template{" "}
          <span className="font-semibold">{activeTemplate?.name}</span>
        </span>
      </div>

      {/* Recently registered — quick select */}
      <Card>
        <CardHeader className="gap-1.5 border-b px-6 py-5">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
            Recently registered
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Newest registrations first — tick up to {MAX_SELECTION} to print.
          </p>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {recentLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground" role="status">
              Loading recent registrations…
            </p>
          ) : recent.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No fisherfolk registered yet.
            </p>
          ) : (
            <ul
              className="grid gap-2 sm:grid-cols-2"
              aria-label="Recently registered fisherfolk quick-select"
            >
              {recent.map((subject) => {
                const isSelected = selected.has(subject.id);
                const blocked = !subject.ready;
                const disabled = blocked || (atMax && !isSelected);
                const missing: string[] = [];
                if (!subject.photo) missing.push("photo");
                if (!subject.signature) missing.push("signature");

                return (
                  <li key={subject.id}>
                    <label
                      htmlFor={`recent-${subject.id}`}
                      className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                        disabled
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:bg-muted/50"
                      } ${isSelected ? "border-primary bg-primary/5" : ""}`}
                    >
                      <Checkbox
                        id={`recent-${subject.id}`}
                        checked={isSelected}
                        disabled={disabled}
                        onCheckedChange={() => toggle(subject)}
                        aria-label={
                          blocked
                            ? `${subject.name} — cannot print: missing ${missing.join(" and ")}`
                            : `Select ${subject.name} for printing`
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {subject.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Registered {formatRegisteredDate(subject.registeredAt)}
                        </span>
                      </span>
                      {blocked ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-destructive">
                          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          Missing {missing.join(", ")}
                        </span>
                      ) : subject.renewalCount > 0 ? (
                        <Badge variant="outline" className="shrink-0 text-xs">
                          Renewal
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-emerald-600 text-xs text-emerald-700 dark:text-emerald-400"
                        >
                          New
                        </Badge>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Search for anyone else */}
      <Card>
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            Find other fisherfolk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6 py-5">
          <ListToolbar>
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="fisherfolk-search"
                placeholder="Search by name or ID number…"
                className="h-9 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search all fisherfolk by name or registration ID"
              />
            </div>
          </ListToolbar>

          {trimmedSearch.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Type a name or ID number to search everyone in the registry.
            </p>
          ) : searchLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground" role="status">
              Searching…
            </p>
          ) : searchResults.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No fisherfolk match “{trimmedSearch}”.
            </p>
          ) : (
            <div className="overflow-auto rounded-md border">
              <Table>
                <caption className="sr-only">
                  Search results. Check rows to add to the print selection (max{" "}
                  {MAX_SELECTION}). Rows marked incomplete cannot be selected.
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      scope="col"
                      className="w-10 border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0"
                      aria-label="Row selection checkbox"
                    />
                    <TableHead scope="col" className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Name</TableHead>
                    <TableHead scope="col" className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Registered</TableHead>
                    <TableHead scope="col" className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Registration</TableHead>
                    <TableHead scope="col" className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Print Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((subject) => {
                    const isSelected = selected.has(subject.id);
                    const blocked = !subject.ready;
                    const disabled = blocked || (atMax && !isSelected);
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
                        <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
                          <Checkbox
                            id={`search-${subject.id}`}
                            checked={isSelected}
                            disabled={disabled}
                            onCheckedChange={() => toggle(subject)}
                            aria-label={
                              blocked
                                ? `${subject.name} — blocked: missing ${missingText}`
                                : `Select ${subject.name} for printing`
                            }
                          />
                        </TableCell>
                        <TableCell className="border-r px-3 py-2 text-sm font-medium last:border-r-0">
                          <label
                            htmlFor={`search-${subject.id}`}
                            className={
                              disabled
                                ? "cursor-not-allowed text-muted-foreground"
                                : "cursor-pointer"
                            }
                          >
                            {subject.name}
                          </label>
                        </TableCell>
                        <TableCell className="border-r px-3 py-2 text-xs text-muted-foreground last:border-r-0">
                          {formatRegisteredDate(subject.registeredAt)}
                        </TableCell>
                        <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
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
                        <TableCell className="px-3 py-2">
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
        </CardContent>
      </Card>

      {/* Selection summary + Next */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm" aria-live="polite">
            <span className="font-semibold">{selectionRatio}</span> selected
            {atMax && (
              <span className="ml-2 text-xs text-muted-foreground">
                (maximum reached — one sheet holds {MAX_SELECTION} IDs)
              </span>
            )}
          </p>
          {selected.size > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Selected fisherfolk">
              {[...selected.values()].map((s) => (
                <li key={s.id}>
                  <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                    {s.name}
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
                      aria-label={`Remove ${s.name} from selection`}
                      className="rounded-sm p-0.5 hover:bg-muted-foreground/20 focus-visible:outline focus-visible:outline-2"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleProceed}
          disabled={selected.size === 0}
          className="gap-2"
          aria-label={
            selected.size === 0
              ? "Select at least one fisherfolk to continue"
              : `Continue to confirm and print ${selected.size} ID${selected.size !== 1 ? "s" : ""}`
          }
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Next: Confirm &amp; Print
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main SelectAndPrint (Step 1 shell with subject-type tabs) ────────────────

export function SelectAndPrint({ onProceedToLayout }: SelectAndPrintProps) {
  const [activeTab, setActiveTab] = useState<"FISHERFOLK" | "VESSEL">(
    "FISHERFOLK",
  );

  const vesselTab = useMemo(
    () => (
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
              Vessel ID card printing is not yet available in this wave.
              Fisherfolk IDs are fully functional.
            </p>
          </div>
        </CardContent>
      </Card>
    ),
    [],
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "FISHERFOLK" | "VESSEL")}
    >
      <UnderlineTabsList>
        <UnderlineTabsTrigger value="FISHERFOLK">
          <Users className="mr-2 h-4 w-4" aria-hidden="true" />
          Fisherfolk IDs
        </UnderlineTabsTrigger>
        <UnderlineTabsTrigger value="VESSEL" aria-label="Vessel IDs — coming soon">
          Vessel IDs
          <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
            Coming soon
          </Badge>
        </UnderlineTabsTrigger>
      </UnderlineTabsList>

      <TabsContent value="FISHERFOLK" className="mt-4">
        <FisherfolkSelectStep onProceedToLayout={onProceedToLayout} />
      </TabsContent>

      <TabsContent value="VESSEL" className="mt-4">
        {vesselTab}
      </TabsContent>
    </Tabs>
  );
}
