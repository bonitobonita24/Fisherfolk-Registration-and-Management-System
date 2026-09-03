"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Crown,
  Trash2,
  TriangleAlert,
  UserMinus,
  UserPlus,
} from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import { normalizeBarangay } from "@/lib/normalize/barangay";
import { SearchInput } from "@/components/shared/search-input";
import {
  RecordHeader,
  DetailField,
  DefinitionGrid,
  ZoomableImage,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import HouseholdMemberMap from "./household-member-map";

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

interface Props {
  id: string;
}

/** True when two barangay names refer to a different place, normalized. */
function isDifferentBarangay(a: string, b: string): boolean {
  const na = normalizeBarangay(a).value ?? a;
  const nb = normalizeBarangay(b).value ?? b;
  return na !== nb;
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]![0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** 36px round photo thumbnail (enlargeable) with an initials fallback. */
export function MemberAvatar({
  photoKey,
  fullName,
}: {
  photoKey: string | null;
  fullName: string;
}) {
  const { data: photoUrlResp } = trpc.upload.getDownloadUrl.useQuery(
    { key: photoKey ?? "" },
    { enabled: !!photoKey },
  );

  if (photoKey && photoUrlResp?.url) {
    return (
      <ZoomableImage
        src={photoUrlResp.url}
        alt={`${fullName}'s photo`}
        ariaLabel={`Enlarge ${fullName}'s photo`}
        thumbnailClassName="size-9 shrink-0 rounded-full border object-cover"
      />
    );
  }

  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-medium text-muted-foreground">
      {initials(fullName)}
    </span>
  );
}

/** Comma-joined category name badges for a member row (FIS-20b). */
export function MemberCategories({
  categoryIds,
  categoriesMap,
}: {
  categoryIds: string[];
  categoriesMap: Map<string, { name: string; color: string | null }>;
}) {
  const names = categoryIds
    .map((cid) => categoriesMap.get(cid))
    .filter((c): c is { name: string; color: string | null } => c != null);

  if (names.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {names.map((c) => {
        const hex =
          c.color && /^#[0-9A-Fa-f]{6}$/.test(c.color) ? c.color : "#6b7280";
        return (
          <span
            key={c.name}
            className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${hex}1a`,
              color: hex,
              borderColor: `${hex}40`,
            }}
          >
            {c.name}
          </span>
        );
      })}
    </div>
  );
}

// ── Add Member dialog ───────────────────────────────────────────────────
function AddMemberDialog({
  householdId,
  currentMemberIds,
  headBarangay,
  open,
  onOpenChange,
  onAdded,
}: {
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

  const addMember = trpc.household.update.useMutation({
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
          <DialogTitle>Add Household Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-member-search">Search fisherfolk</Label>
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
                          id: householdId,
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

// ── Change Head dialog ──────────────────────────────────────────────────
function ChangeHeadDialog({
  householdId,
  headId,
  members,
  open,
  onOpenChange,
  onChanged,
}: {
  householdId: string;
  headId: string;
  members: FisherfolkLite[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const changeHead = trpc.household.update.useMutation({
    onSuccess: () => {
      toast.success("Household head changed.");
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
          <DialogTitle>Change Household Head</DialogTitle>
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
                  changeHead.mutate({ id: householdId, newHeadId: person.id })
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

// ── Edit Details dialog ─────────────────────────────────────────────────
function EditDetailsDialog({
  householdId,
  initialBarangay,
  initialAddress,
  initialNotes,
  open,
  onOpenChange,
  onSaved,
}: {
  householdId: string;
  initialBarangay: string | null;
  initialAddress: string | null;
  initialNotes: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [barangay, setBarangay] = useState(initialBarangay ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");

  useEffect(() => {
    if (open) {
      setBarangay(initialBarangay ?? "");
      setAddress(initialAddress ?? "");
      setNotes(initialNotes ?? "");
    }
  }, [open, initialBarangay, initialAddress, initialNotes]);

  const updateDetails = trpc.household.update.useMutation({
    onSuccess: () => {
      toast.success("Household details updated.");
      onOpenChange(false);
      onSaved();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update household details.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateDetails.mutate({
      id: householdId,
      barangay,
      address,
      notes,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Household Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-barangay">Barangay</Label>
            <Input
              id="edit-barangay"
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              disabled={updateDetails.isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-address">Address</Label>
            <Input
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={updateDetails.isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={updateDetails.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateDetails.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateDetails.isPending}>
              {updateDetails.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ─────────────────────────────────────────────────────
export function HouseholdDetailClient({ id }: Props) {
  const tenantHref = useTenantHref();
  const router = useRouter();
  const utils = trpc.useUtils();

  const {
    data: record,
    isLoading,
    isError,
    error,
  } = trpc.household.getById.useQuery({ id });

  const { data: categories } = trpc.category.list.useQuery({});
  const categoriesMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string | null }>();
    for (const c of categories ?? []) {
      map.set(c.id, { name: c.name, color: c.displayColor ?? null });
    }
    return map;
  }, [categories]);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [changeHeadOpen, setChangeHeadOpen] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);

  function refresh() {
    void utils.household.getById.invalidate({ id });
    void utils.household.list.invalidate();
  }

  const removeMember = trpc.household.update.useMutation({
    onSuccess: () => {
      toast.success("Member removed.");
      refresh();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to remove member.");
    },
  });

  const removeHousehold = trpc.household.remove.useMutation({
    onSuccess: () => {
      toast.success("Household deleted.");
      router.push(tenantHref("/households"));
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to delete household.");
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading household…</p>;
  }

  if (isError) {
    const notFound = error?.data?.code === "NOT_FOUND";
    return (
      <div className="space-y-4 pb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={tenantHref("/households")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <Card className="gap-0 py-5">
          <CardContent className="px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {notFound ? "Household not found." : "Failed to load household."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) return null;

  const currentMemberIds = [record.head.id, ...record.members.map((m) => m.id)];

  return (
    <div className="space-y-4 pb-4">
      <RecordHeader
        backHref={tenantHref("/households")}
        backLabel="Back to households"
        title={record.householdNumber}
        meta={`Head: ${record.head.fullName}`}
        actions={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Household
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this household?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will unlink all {currentMemberIds.length} member
                  {currentMemberIds.length !== 1 ? "s" : ""} from this
                  household. Fisherfolk records themselves are not deleted.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={removeHousehold.isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={removeHousehold.isPending}
                  onClick={() => removeHousehold.mutate({ id: record.id })}
                >
                  {removeHousehold.isPending ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />

      {/* FIS-23 — details/members left, member-location map right (50/50, stacks on small screens) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {/* Details */}
          <Card className="gap-0 py-5">
            <CardHeader className="flex flex-row items-center justify-between px-6 pb-4 pt-0">
              <CardTitle className="text-sm font-medium">Household Details</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditDetailsOpen(true)}
              >
                Edit Details
              </Button>
            </CardHeader>
            <CardContent className="px-6 py-0">
              <DefinitionGrid columns={3}>
                <DetailField label="Household Number" value={record.householdNumber} />
                <DetailField label="Barangay" value={record.barangay} />
                <DetailField label="Address" value={record.address} />
              </DefinitionGrid>
              {record.notes && (
                <div className="mt-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {record.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card className="gap-0 py-5">
            <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-4 pt-0">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
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
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setAddMemberOpen(true)}
                >
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
                      photoKey={record.head.photo}
                      fullName={record.head.fullName}
                    />
                    <Link
                      href={tenantHref(`/fisherfolk/${record.head.id}`)}
                      className="min-w-0 flex-1 hover:underline"
                    >
                      <p className="truncate text-sm font-medium text-foreground">
                        {record.head.fullName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {record.head.idNumber} · {record.head.barangay}
                      </p>
                    </Link>
                    <div className="w-28 shrink-0">
                      <MemberCategories
                        categoryIds={record.head.categoryIds}
                        categoriesMap={categoriesMap}
                      />
                    </div>
                    <Badge variant="secondary">Head</Badge>
                  </li>
                  {record.members
                    .filter((m) => m.id !== record.head.id)
                    .map((member) => {
                      const mismatch = isDifferentBarangay(
                        member.barangay,
                        record.head.barangay,
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
                                id: record.id,
                                removeMemberIds: [member.id],
                              })
                            }
                            aria-label={`Remove ${member.fullName} from household`}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </li>
                      );
                    })}
                  {record.members.filter((m) => m.id !== record.head.id)
                    .length === 0 && (
                    <li className="py-2 text-sm text-muted-foreground first:pt-0 last:pb-0">
                      No additional members.
                    </li>
                  )}
                </ul>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <HouseholdMemberMap
            members={[
              {
                id: record.head.id,
                fullName: record.head.fullName,
                barangay: record.head.barangay,
                isHead: true,
                latitude: record.head.latitude,
                longitude: record.head.longitude,
              },
              ...record.members
                .filter((m) => m.id !== record.head.id)
                .map((m) => ({
                  id: m.id,
                  fullName: m.fullName,
                  barangay: m.barangay,
                  isHead: false,
                  latitude: m.latitude,
                  longitude: m.longitude,
                })),
            ]}
            headBarangay={record.head.barangay}
          />
        </div>
      </div>

      <AddMemberDialog
        householdId={record.id}
        currentMemberIds={currentMemberIds}
        headBarangay={record.head.barangay}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onAdded={refresh}
      />
      <ChangeHeadDialog
        householdId={record.id}
        headId={record.head.id}
        members={record.members}
        open={changeHeadOpen}
        onOpenChange={setChangeHeadOpen}
        onChanged={refresh}
      />
      <EditDetailsDialog
        householdId={record.id}
        initialBarangay={record.barangay}
        initialAddress={record.address}
        initialNotes={record.notes}
        open={editDetailsOpen}
        onOpenChange={setEditDetailsOpen}
        onSaved={refresh}
      />
    </div>
  );
}
