"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import {
  FISHERFOLK_STATUS_VALUES,
  type AyudaBeneficiaryFilter,
} from "@frms/shared/schemas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

const PAGE_LIMIT = 20;

type VesselOwnerFilter = AyudaBeneficiaryFilter["vesselOwner"];

interface Props {
  programId: string;
  distributionUnit: "FISHERFOLK" | "HOUSEHOLD";
  canManage: boolean;
  onChanged: () => void;
}

/**
 * Labelled multi-select: a Popover trigger button showing the current
 * selection count, containing a scrollable list of labelled checkboxes.
 */
function MultiSelectPopover({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const idBase = `bulk-filter-${label.toLowerCase().replace(/\s+/g, "-")}`;

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={`${idBase}-trigger`}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={`${idBase}-trigger`}
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
          >
            <span>
              {selected.length === 0
                ? `Any ${label.toLowerCase()}`
                : `${selected.length} selected`}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="max-h-64 w-64 overflow-y-auto p-2"
          align="start"
        >
          {options.length === 0 && (
            <p className="p-2 text-sm text-muted-foreground">
              No options available.
            </p>
          )}
          <div role="group" aria-label={label} className="space-y-1">
            {options.map((opt) => {
              const checkboxId = `${idBase}-${opt.value}`;
              return (
                <div key={opt.value} className="flex items-center gap-2 px-1 py-1">
                  <Checkbox
                    id={checkboxId}
                    checked={selected.includes(opt.value)}
                    onCheckedChange={() => toggle(opt.value)}
                  />
                  <Label htmlFor={checkboxId} className="cursor-pointer font-normal">
                    {opt.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function HouseholdMultiSelectPopover({
  selected,
  onChange,
}: {
  selected: { id: string; householdNumber: string; barangay: string }[];
  onChange: (next: { id: string; householdNumber: string; barangay: string }[]) => void;
}) {
  const [search, setSearch] = useState("");
  const listQuery = trpc.household.list.useQuery(
    { search, limit: 10 },
    { enabled: search.trim().length >= 2 },
  );
  const selectedIds = selected.map((h) => h.id);

  function toggle(hh: { id: string; householdNumber: string; barangay: string }) {
    onChange(
      selectedIds.includes(hh.id)
        ? selected.filter((h) => h.id !== hh.id)
        : [...selected, hh],
    );
  }

  return (
    <div className="space-y-1">
      <Label htmlFor="bulk-filter-household-trigger">Household</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="bulk-filter-household-trigger"
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
          >
            <span>
              {selected.length === 0
                ? "Any household"
                : `${selected.length} selected`}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-2 p-2" align="start">
          <Input
            aria-label="Search households"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search households…"
          />
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selected.map((hh) => (
                <Badge key={hh.id} variant="secondary" className="text-xs">
                  {hh.householdNumber}
                </Badge>
              ))}
            </div>
          )}
          <div className="max-h-48 space-y-1 overflow-y-auto" role="group" aria-label="Household results">
            {search.trim().length < 2 && (
              <p className="p-2 text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </p>
            )}
            {listQuery.isLoading && (
              <p className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </p>
            )}
            {(listQuery.data?.items ?? []).map((hh) => {
              const checkboxId = `bulk-filter-household-${hh.id}`;
              return (
                <div key={hh.id} className="flex items-center gap-2 px-1 py-1">
                  <Checkbox
                    id={checkboxId}
                    checked={selectedIds.includes(hh.id)}
                    onCheckedChange={() =>
                      toggle({
                        id: hh.id,
                        householdNumber: hh.householdNumber,
                        barangay: hh.barangay,
                      })
                    }
                  />
                  <Label htmlFor={checkboxId} className="cursor-pointer font-normal">
                    {hh.householdNumber} — {hh.head.fullName}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({hh.barangay})
                    </span>
                  </Label>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function BulkFilterDialog({
  programId,
  distributionUnit,
  canManage,
  onChanged,
}: Props) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [barangays, setBarangays] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [households, setHouseholds] = useState<
    { id: string; householdNumber: string; barangay: string }[]
  >([]);
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [vesselOwner, setVesselOwner] = useState<VesselOwnerFilter>(undefined);

  const [debouncedFilter, setDebouncedFilter] = useState<AyudaBeneficiaryFilter>({});

  const filter: AyudaBeneficiaryFilter = useMemo(() => {
    const f: AyudaBeneficiaryFilter = {};
    if (barangays.length > 0) f.barangays = barangays;
    if (categoryIds.length > 0) f.categoryIds = categoryIds;
    if (statuses.length > 0)
      f.statuses = statuses as AyudaBeneficiaryFilter["statuses"];
    if (vesselTypes.length > 0) f.vesselTypes = vesselTypes;
    if (households.length > 0) f.householdIds = households.map((h) => h.id);
    const min = Number.parseInt(ageMin, 10);
    if (!Number.isNaN(min)) f.ageMin = min;
    const max = Number.parseInt(ageMax, 10);
    if (!Number.isNaN(max)) f.ageMax = max;
    if (vesselOwner !== undefined) f.vesselOwner = vesselOwner;
    return f;
  }, [barangays, categoryIds, statuses, vesselTypes, households, ageMin, ageMax, vesselOwner]);

  const filterKey = JSON.stringify(filter);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilter(filter);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [filterKey]);

  const facetQuery = trpc.ayuda.filterFacetOptions.useQuery(undefined, {
    enabled: open,
  });

  const searchQuery = trpc.ayuda.searchEligibleBeneficiaries.useQuery(
    { programId, filter: debouncedFilter, page, limit: PAGE_LIMIT, onlyEligible: true },
    { enabled: open },
  );

  const addBeneficiaries = trpc.ayuda.addBeneficiaries.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.added} added, ${result.skipped} skipped`);
      setSelectedIds(new Set());
      void searchQuery.refetch();
      onChanged();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add beneficiaries.");
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSelectedIds(new Set());
      setPage(1);
    }
  }

  function clearFilters() {
    setBarangays([]);
    setCategoryIds([]);
    setStatuses([]);
    setVesselTypes([]);
    setHouseholds([]);
    setAgeMin("");
    setAgeMax("");
    setVesselOwner(undefined);
  }

  const data = searchQuery.data;
  const mode = data?.mode ?? (distributionUnit === "HOUSEHOLD" ? "HOUSEHOLD" : "FISHERFOLK");
  const total = data?.total ?? 0;
  const matchingIds = data?.matchingIds ?? [];
  const matchingTruncated = data?.matchingTruncated ?? false;
  const idKey = distributionUnit === "HOUSEHOLD" ? "householdIds" : "fisherfolkIds";

  const rowIds: string[] =
    data === undefined
      ? []
      : data.mode === "HOUSEHOLD"
        ? data.rows.map((r) => r.householdId)
        : data.rows.map((r) => r.id);

  const allPageSelected =
    rowIds.length > 0 && rowIds.every((id) => selectedIds.has(id));

  function togglePageAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        rowIds.forEach((id) => next.delete(id));
      } else {
        rowIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddAllMatching() {
    if (matchingIds.length === 0) return;
    addBeneficiaries.mutate({ programId, [idKey]: matchingIds });
  }

  function handleAddSelected() {
    if (selectedIds.size === 0) return;
    addBeneficiaries.mutate({ programId, [idKey]: [...selectedIds] });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  if (!canManage) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Filter &amp; Bulk Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Filter &amp; Bulk Add Beneficiaries</DialogTitle>
          <DialogDescription>
            Combine filters to find eligible {distributionUnit === "HOUSEHOLD" ? "households" : "fisherfolk"},
            then add all matching or a manual selection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MultiSelectPopover
              label="Barangay"
              options={(facetQuery.data?.barangays ?? []).map((b) => ({
                value: b,
                label: b,
              }))}
              selected={barangays}
              onChange={setBarangays}
            />
            <MultiSelectPopover
              label="Category"
              options={(facetQuery.data?.categories ?? []).map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              selected={categoryIds}
              onChange={setCategoryIds}
            />
            <MultiSelectPopover
              label="Status"
              options={(facetQuery.data?.statuses ?? FISHERFOLK_STATUS_VALUES).map(
                (s: string) => ({ value: s, label: s }),
              )}
              selected={statuses}
              onChange={setStatuses}
            />
            <MultiSelectPopover
              label="Vessel type"
              options={(facetQuery.data?.vesselTypes ?? []).map((v) => ({
                value: v,
                label: v,
              }))}
              selected={vesselTypes}
              onChange={setVesselTypes}
            />
            <HouseholdMultiSelectPopover
              selected={households}
              onChange={setHouseholds}
            />
            <div className="space-y-1">
              <Label htmlFor="bulk-filter-age-min">Min age</Label>
              <Input
                id="bulk-filter-age-min"
                type="number"
                min={0}
                max={150}
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                placeholder="Any"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bulk-filter-age-max">Max age</Label>
              <Input
                id="bulk-filter-age-max"
                type="number"
                min={0}
                max={150}
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                placeholder="Any"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bulk-filter-vessel-owner">Vessel owner</Label>
              <Select
                value={vesselOwner ?? "any"}
                onValueChange={(v) =>
                  setVesselOwner(v === "any" ? undefined : (v as VesselOwnerFilter))
                }
              >
                <SelectTrigger id="bulk-filter-vessel-owner">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="yes">Owner</SelectItem>
                  <SelectItem value="no">Non-owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {searchQuery.isLoading ? "Searching…" : `${total.toLocaleString()} matching`}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>

          {matchingTruncated && (
            <p className="text-xs text-muted-foreground">
              &ldquo;Add all matching&rdquo; covers the first 5,000 results only.
            </p>
          )}

          <div className="max-h-80 overflow-y-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Select all on this page"
                      checked={allPageSelected}
                      onCheckedChange={togglePageAll}
                      disabled={rowIds.length === 0}
                    />
                  </TableHead>
                  {mode === "HOUSEHOLD" ? (
                    <>
                      <TableHead>Household</TableHead>
                      <TableHead>Head</TableHead>
                      <TableHead>Barangay</TableHead>
                      <TableHead>Members</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>Barangay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Vessel owner</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      Loading results…
                    </TableCell>
                  </TableRow>
                )}
                {!searchQuery.isLoading && rowIds.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      No eligible records match these filters.
                    </TableCell>
                  </TableRow>
                )}
                {data !== undefined && data.mode === "HOUSEHOLD" &&
                  data.rows.map((row) => (
                    <TableRow key={row.householdId}>
                      <TableCell>
                        <Checkbox
                          aria-label={`Select household ${row.householdNumber}`}
                          checked={selectedIds.has(row.householdId)}
                          onCheckedChange={() => toggleRow(row.householdId)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{row.householdNumber}</TableCell>
                      <TableCell>{row.headName}</TableCell>
                      <TableCell>{row.barangay}</TableCell>
                      <TableCell>{row.memberCount}</TableCell>
                    </TableRow>
                  ))}
                {data !== undefined && data.mode === "FISHERFOLK" &&
                  data.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Checkbox
                          aria-label={`Select ${row.fullName}`}
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleRow(row.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{row.fullName}</TableCell>
                      <TableCell>{row.idNumber ?? "—"}</TableCell>
                      <TableCell>{row.barangay}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.age ?? "—"}</TableCell>
                      <TableCell>{row.isVesselOwner ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddSelected}
            disabled={selectedIds.size === 0 || addBeneficiaries.isPending}
          >
            {addBeneficiaries.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add selected ({selectedIds.size})
          </Button>
          <Button
            type="button"
            onClick={handleAddAllMatching}
            disabled={total === 0 || addBeneficiaries.isPending}
          >
            {addBeneficiaries.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add all {total.toLocaleString()} matching
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
