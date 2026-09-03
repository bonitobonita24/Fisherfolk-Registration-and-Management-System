"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Crown, TriangleAlert, UserMinus, UserPlus } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import { normalizeBarangay } from "@/lib/normalize/barangay";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MemberAvatar, MemberCategories } from "./household-detail-client";

// ── Types ────────────────────────────────────────────────────────────────
interface FisherfolkLite {
  id: string;
  idNumber: string;
  fullName: string;
  barangay: string;
  categoryIds: string[];
  photo: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface FamilyLite {
  id: string;
  familyNumber: string;
  notes: string | null;
  head: FisherfolkLite;
  members: FisherfolkLite[];
}

type CategoriesMap = Map<string, { name: string; color: string | null }>;

/** True when two barangay names refer to a different place, normalized. */
function isDifferentBarangay(a: string, b: string): boolean {
  const na = normalizeBarangay(a).value ?? a;
  const nb = normalizeBarangay(b).value ?? b;
  return na !== nb;
}

// ── Change Head dialog (family-scoped) ──────────────────────────────────
export function FamilyChangeHeadDialog({
  familyId,
  headId,
  members,
  open,
  onOpenChange,
  onChanged,
}: {
  familyId: string;
  headId: string;
  members: FisherfolkLite[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const changeHead = trpc.family.update.useMutation({
    onSuccess: () => {
      toast.success("Family head changed.");
      onOpenChange(false);
      onChanged();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to change head.");
    },
  });

  const candidates = members.filter((m) => m.id !== headId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Family Head</DialogTitle>
        </DialogHeader>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {candidates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add another member first to be able to change the head.
            </p>
          )}
          {candidates.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {person.fullName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {person.idNumber} · {person.barangay}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={changeHead.isPending}
                onClick={() =>
                  changeHead.mutate({ id: familyId, newHeadId: person.id })
                }
              >
                Make Head
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Member dialog (family-scoped) ───────────────────────────────────
export function FamilyAddMemberDialog({
  familyId,
  householdId,
  currentMemberIds,
  headBarangay,
  open,
  onOpenChange,
  onAdded,
}: {
  familyId: string;
  householdId: string;
  currentMemberIds: string[];
  headBarangay: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const results = trpc.household.availableFisherfolk.useQuery(
    { search, excludeHouseholdId: householdId },
    { enabled: open },
  );

  const filtered = useMemo(() => {
    if (!results.data) return [];
    return results.data.filter((p) => !currentMemberIds.includes(p.id));
  }, [results.data, currentMemberIds]);

  const addMember = trpc.family.update.useMutation({
    onSuccess: () => {
      toast.success("Member added.");
      onAdded();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to add member.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="family-add-member-search">Search fisherfolk</Label>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name or ID number..."
              className="w-full max-w-none"
            />
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {results.isLoading && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {!results.isLoading && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No available fisherfolk found.
              </p>
            )}
            {filtered.map((person) => {
              const mismatch = isDifferentBarangay(
                person.barangay,
                headBarangay,
              );
              return (
                <div
                  key={person.id}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {person.fullName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {person.idNumber} · {person.barangay}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={addMember.isPending}
                      onClick={() =>
                        addMember.mutate({
                          id: familyId,
                          addMemberIds: [person.id],
                        })
                      }
                    >
                      Add
                    </Button>
                  </div>
                  {mismatch && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                      <TriangleAlert className="size-3.5 shrink-0" />
                      Not in the same barangay as the head — add anyway?
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Family section (one card per family) ────────────────────────────────
export function FamilySection({
  family,
  householdId,
  categoriesMap,
  onChanged,
}: {
  family: FamilyLite;
  householdId: string;
  categoriesMap: CategoriesMap;
  onChanged: () => void;
}) {
  const tenantHref = useTenantHref();
  const [changeHeadOpen, setChangeHeadOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const currentMemberIds = [
    family.head.id,
    ...family.members.map((m) => m.id),
  ];

  const removeMember = trpc.family.update.useMutation({
    onSuccess: () => {
      toast.success("Member removed.");
      onChanged();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to remove member.");
    },
  });

  const nonHeadMembers = family.members.filter((m) => m.id !== family.head.id);

  return (
    <Card className="gap-0 py-5">
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-4 pt-0">
        <CardTitle className="text-sm font-medium">
          Family {family.familyNumber}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setChangeHeadOpen(true)}
          >
            <Crown className="mr-2 h-4 w-4" />
            Change Head
          </Button>
          <Button type="button" size="sm" onClick={() => setAddMemberOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-0">
        <TooltipProvider>
          <ul className="divide-y">
            <li className="flex items-center gap-3 py-2 first:pt-0">
              <MemberAvatar
                photoKey={family.head.photo}
                fullName={family.head.fullName}
              />
              <Link
                href={tenantHref(`/fisherfolk/${family.head.id}`)}
                className="min-w-0 flex-1 hover:underline"
              >
                <p className="truncate text-sm font-medium text-foreground">
                  {family.head.fullName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {family.head.idNumber} · {family.head.barangay}
                </p>
              </Link>
              <div className="w-28 shrink-0">
                <MemberCategories
                  categoryIds={family.head.categoryIds}
                  categoriesMap={categoriesMap}
                />
              </div>
              <Badge variant="secondary">Head</Badge>
            </li>
            {nonHeadMembers.map((member) => {
              const mismatch = isDifferentBarangay(
                member.barangay,
                family.head.barangay,
              );
              return (
                <li
                  key={member.id}
                  className="flex items-center gap-3 py-2 last:pb-0"
                >
                  <MemberAvatar
                    photoKey={member.photo}
                    fullName={member.fullName}
                  />
                  <Link
                    href={tenantHref(`/fisherfolk/${member.id}`)}
                    className="min-w-0 flex-1 hover:underline"
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {member.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.idNumber} · {member.barangay}
                    </p>
                  </Link>
                  <div className="w-28 shrink-0">
                    <MemberCategories
                      categoryIds={member.categoryIds}
                      categoriesMap={categoriesMap}
                    />
                  </div>
                  {mismatch && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TriangleAlert
                          className="size-4 shrink-0 text-amber-600 dark:text-amber-500"
                          aria-label={`${member.fullName} is in a different barangay from the head of family`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        Different barangay from head of family
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={removeMember.isPending}
                    onClick={() =>
                      removeMember.mutate({
                        id: family.id,
                        removeMemberIds: [member.id],
                      })
                    }
                    aria-label={`Remove ${member.fullName} from family`}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
            {nonHeadMembers.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground first:pt-0 last:pb-0">
                No additional members.
              </li>
            )}
          </ul>
        </TooltipProvider>
      </CardContent>

      <FamilyChangeHeadDialog
        familyId={family.id}
        headId={family.head.id}
        members={family.members}
        open={changeHeadOpen}
        onOpenChange={setChangeHeadOpen}
        onChanged={onChanged}
      />
      <FamilyAddMemberDialog
        familyId={family.id}
        householdId={householdId}
        currentMemberIds={currentMemberIds}
        headBarangay={family.head.barangay}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onAdded={onChanged}
      />
    </Card>
  );
}
