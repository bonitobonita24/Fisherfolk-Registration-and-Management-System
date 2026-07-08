"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Crown, Trash2, UserMinus, UserPlus } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { SearchInput } from "@/components/shared/search-input";
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

// ── Types ────────────────────────────────────────────────────────────────
interface FisherfolkLite {
  id: string;
  idNumber: string;
  fullName: string;
  barangay: string;
  categoryIds: string[];
}

interface Props {
  id: string;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">
        {value === null || value === undefined || value === "" ? "—" : value}
      </p>
    </div>
  );
}

// ── Add Member dialog ───────────────────────────────────────────────────
function AddMemberDialog({
  householdId,
  currentMemberIds,
  open,
  onOpenChange,
  onAdded,
}: {
  householdId: string;
  currentMemberIds: string[];
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
            {filtered.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
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
            ))}
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
              className="flex items-center justify-between gap-3 rounded-md border p-3"
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
  const params = useParams<{ tenant: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();

  const {
    data: record,
    isLoading,
    isError,
    error,
  } = trpc.household.getById.useQuery({ id });

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
      router.push(`/${params.tenant}/households`);
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
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${params.tenant}/households`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${params.tenant}/households`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {record.householdNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Head: {record.head.fullName}
            </p>
          </div>
        </div>

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
      </div>

      {/* Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Household Details</CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setEditDetailsOpen(true)}
          >
            Edit Details
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Household Number" value={record.householdNumber} />
            <Field label="Barangay" value={record.barangay} />
            <Field label="Address" value={record.address} />
          </div>
          {record.notes && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {record.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Members</CardTitle>
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
        <CardContent>
          <ul className="divide-y">
            <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
              <Link
                href={`/${params.tenant}/fisherfolk/${record.head.id}`}
                className="min-w-0 flex-1 hover:underline"
              >
                <p className="truncate font-medium text-foreground">
                  {record.head.fullName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {record.head.idNumber} · {record.head.barangay}
                </p>
              </Link>
              <Badge>Head</Badge>
            </li>
            {record.members
              .filter((m) => m.id !== record.head.id)
              .map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 py-3 last:pb-0"
                >
                  <Link
                    href={`/${params.tenant}/fisherfolk/${member.id}`}
                    className="min-w-0 flex-1 hover:underline"
                  >
                    <p className="truncate font-medium text-foreground">
                      {member.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.idNumber} · {member.barangay}
                    </p>
                  </Link>
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
              ))}
            {record.members.filter((m) => m.id !== record.head.id).length ===
              0 && (
              <li className="py-3 text-sm text-muted-foreground first:pt-0 last:pb-0">
                No additional members.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      <AddMemberDialog
        householdId={record.id}
        currentMemberIds={currentMemberIds}
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
