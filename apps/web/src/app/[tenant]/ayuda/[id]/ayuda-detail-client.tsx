"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MapPin, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import { MakeTodoDialog } from "@/components/todo/make-todo-dialog";
import { LinkedTodos } from "@/components/todo/linked-todos";
import { BulkFilterDialog } from "./bulk-filter-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { AttachmentList, type AttachmentItem } from "@/components/shared/attachment-list";
import {
  AttachmentUpload,
  type UploadedAttachment,
} from "@/components/shared/attachment-upload";
import {
  RecordHeader,
  DetailField,
  DefinitionGrid,
  LocationPicker,
} from "@/components/shared";

interface Props {
  id: string;
  canManage: boolean;
}

interface SelectedFisherfolk {
  id: string;
  fullName: string;
  idNumber: string;
}

interface SelectedHousehold {
  id: string;
  householdNumber: string;
  headName: string;
  barangay: string;
}

function formatDate(value: Date | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function AddBeneficiaryDialog({
  programId,
  distributionUnit,
}: {
  programId: string;
  distributionUnit: "FISHERFOLK" | "HOUSEHOLD";
}) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFisherfolk, setSelectedFisherfolk] =
    useState<SelectedFisherfolk | null>(null);
  const [selectedHousehold, setSelectedHousehold] =
    useState<SelectedHousehold | null>(null);

  const isHouseholdMode = distributionUnit === "HOUSEHOLD";

  const fisherfolkListQuery = trpc.fisherfolk.list.useQuery(
    { search, limit: 10 },
    { enabled: !isHouseholdMode && search.trim().length >= 2 },
  );

  const householdListQuery = trpc.household.list.useQuery(
    { search, limit: 10 },
    { enabled: isHouseholdMode && search.trim().length >= 2 },
  );

  const add = trpc.ayuda.addBeneficiary.useMutation({
    onSuccess: () => {
      toast.success("Beneficiary added.");
      setOpen(false);
      setSearch("");
      setSelectedFisherfolk(null);
      setSelectedHousehold(null);
      void utils.ayuda.listBeneficiaries.invalidate({ programId });
      void utils.ayuda.getProgramById.invalidate({ id: programId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add beneficiary.");
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSearch("");
      setSelectedFisherfolk(null);
      setSelectedHousehold(null);
    }
  }

  function handleAdd() {
    if (isHouseholdMode) {
      if (!selectedHousehold) return;
      add.mutate({ programId, householdId: selectedHousehold.id });
    } else {
      if (!selectedFisherfolk) return;
      add.mutate({ programId, fisherfolkId: selectedFisherfolk.id });
    }
  }

  const hasSelection = isHouseholdMode
    ? selectedHousehold !== null
    : selectedFisherfolk !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Beneficiary
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Beneficiary</DialogTitle>
          <DialogDescription>
            {isHouseholdMode
              ? "Search for a household to enroll in this program. The household head will be recorded as the beneficiary."
              : "Search for a fisherfolk to enroll in this program."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {isHouseholdMode ? (
            selectedHousehold ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1 rounded-lg pr-1">
                  <span>{selectedHousehold.householdNumber}</span>
                  <span className="opacity-70">
                    {selectedHousehold.headName}
                  </span>
                  <span className="font-mono text-xs opacity-70">
                    {selectedHousehold.barangay}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedHousehold(null)}
                    className="ml-1 rounded hover:bg-muted"
                    aria-label="Remove household"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            ) : (
              <>
                <Input
                  aria-label="Search households"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search households by number, barangay, or head name…"
                />
                <p className="text-xs text-muted-foreground">
                  Type at least 2 characters to search.
                </p>
                {search.trim().length >= 2 && (
                  <div className="rounded-lg border border-border bg-card">
                    {householdListQuery.isLoading && (
                      <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching…
                      </div>
                    )}
                    {!householdListQuery.isLoading &&
                      (householdListQuery.data?.items.length ?? 0) === 0 && (
                        <p className="p-3 text-sm text-muted-foreground">
                          No households found for &ldquo;{search}&rdquo;.
                        </p>
                      )}
                    {(householdListQuery.data?.items ?? []).map((hh) => (
                      <button
                        key={hh.id}
                        type="button"
                        onClick={() => {
                          setSelectedHousehold({
                            id: hh.id,
                            householdNumber: hh.householdNumber,
                            headName: hh.head.fullName,
                            barangay: hh.barangay,
                          });
                          setSearch("");
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span className="font-medium text-foreground">
                          {hh.householdNumber} — {hh.head.fullName}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {hh.barangay}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )
          ) : selectedFisherfolk ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1 rounded-lg pr-1">
                <span>{selectedFisherfolk.fullName}</span>
                <span className="font-mono text-xs opacity-70">
                  {selectedFisherfolk.idNumber}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFisherfolk(null)}
                  className="ml-1 rounded hover:bg-muted"
                  aria-label="Remove fisherfolk"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          ) : (
            <>
              <Input
                aria-label="Search fisherfolk"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fisherfolk by name or ID number…"
              />
              <p className="text-xs text-muted-foreground">
                Type at least 2 characters to search.
              </p>
              {search.trim().length >= 2 && (
                <div className="rounded-lg border border-border bg-card">
                  {fisherfolkListQuery.isLoading && (
                    <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching…
                    </div>
                  )}
                  {!fisherfolkListQuery.isLoading &&
                    (fisherfolkListQuery.data?.items.length ?? 0) === 0 && (
                      <p className="p-3 text-sm text-muted-foreground">
                        No fisherfolk found for &ldquo;{search}&rdquo;.
                      </p>
                    )}
                  {(fisherfolkListQuery.data?.items ?? []).map((ff) => (
                    <button
                      key={ff.id}
                      type="button"
                      onClick={() => {
                        setSelectedFisherfolk({
                          id: ff.id,
                          fullName: ff.fullName,
                          idNumber: ff.idNumber,
                        });
                        setSearch("");
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="font-medium text-foreground">
                        {ff.fullName}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {ff.idNumber}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={!hasSelection || add.isPending}>
            {add.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add Beneficiary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Verify dropdown + "Mark Received" location-capture dialog for one beneficiary row. */
function BeneficiaryActions({
  beneficiaryId,
  onVerify,
  isPending,
}: {
  beneficiaryId: string;
  onVerify: (input: {
    id: string;
    verificationStatus: "RECEIVED" | "CANCELLED";
    latitude?: number | null;
    longitude?: number | null;
  }) => void;
  isPending: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  // The dialog is opened from a DropdownMenuItem that unmounts when the menu
  // closes, so Radix has no trigger to restore focus to on dialog close and
  // focus falls to <body> (WCAG 2.4.3). Restore focus to the Verify button.
  const verifyTriggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={verifyTriggerRef}
            size="sm"
            variant="outline"
            className="h-8"
            disabled={isPending}
          >
            Verify
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setMenuOpen(false);
              setDialogOpen(true);
            }}
          >
            Mark Received
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              onVerify({ id: beneficiaryId, verificationStatus: "CANCELLED" })
            }
          >
            Cancel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={dialogOpen}
        onOpenChange={(next) => {
          setDialogOpen(next);
          if (!next) setCoords(null);
        }}
      >
        <DialogContent
          onCloseAutoFocus={(e) => {
            // Restore focus to the Verify trigger; its DropdownMenuItem opener
            // is already unmounted, so Radix would otherwise focus <body>.
            e.preventDefault();
            verifyTriggerRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Mark as Received</DialogTitle>
            <DialogDescription>
              Optional — record where the aid was distributed to this
              beneficiary.
            </DialogDescription>
          </DialogHeader>
          <LocationPicker value={coords} onChange={setCoords} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={() => {
                onVerify({
                  id: beneficiaryId,
                  verificationStatus: "RECEIVED",
                  latitude: coords?.lat ?? null,
                  longitude: coords?.lng ?? null,
                });
                setDialogOpen(false);
              }}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BeneficiariesTable({
  programId,
  canManage,
}: {
  programId: string;
  canManage: boolean;
}) {
  const tenantHref = useTenantHref();
  const utils = trpc.useUtils();
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<
    Set<string>
  >(new Set());
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const { data, isLoading } = trpc.ayuda.listBeneficiaries.useQuery({
    programId,
    page: 1,
    limit: 200,
  });

  const verify = trpc.ayuda.verifyBeneficiary.useMutation({
    onSuccess: () => {
      toast.success("Beneficiary updated.");
      void utils.ayuda.listBeneficiaries.invalidate({ programId });
      void utils.ayuda.getProgramById.invalidate({ id: programId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update beneficiary.");
    },
  });

  const removeBeneficiaries = trpc.ayuda.removeBeneficiaries.useMutation({
    onSuccess: (result) => {
      toast.success(
        `${result.removed} removed, ${result.skipped} skipped.`,
      );
      setSelectedBeneficiaryIds(new Set());
      setRemoveConfirmOpen(false);
      void utils.ayuda.listBeneficiaries.invalidate({ programId });
      void utils.ayuda.getProgramById.invalidate({ id: programId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to remove beneficiaries.");
    },
  });

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading beneficiaries…</p>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No beneficiaries yet.</p>
    );
  }

  const removableItems = items.filter(
    (b) => b.verificationStatus === "PENDING",
  );
  const allRemovableSelected =
    removableItems.length > 0 &&
    removableItems.every((b) => selectedBeneficiaryIds.has(b.id));

  function toggleSelectAll(checked: boolean) {
    setSelectedBeneficiaryIds(
      checked ? new Set(removableItems.map((b) => b.id)) : new Set(),
    );
  }

  function toggleSelectOne(id: string, checked: boolean) {
    setSelectedBeneficiaryIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {canManage && selectedBeneficiaryIds.size > 0 && (
        <div className="flex items-center justify-end">
          <AlertDialog
            open={removeConfirmOpen}
            onOpenChange={setRemoveConfirmOpen}
          >
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                Remove selected ({selectedBeneficiaryIds.size})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove selected beneficiaries?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove {selectedBeneficiaryIds.size} pending
                  beneficiar
                  {selectedBeneficiaryIds.size !== 1 ? "ies" : "y"} from this
                  program. Confirmed distributions cannot be removed. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={removeBeneficiaries.isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={removeBeneficiaries.isPending}
                  onClick={() =>
                    removeBeneficiaries.mutate({
                      programId,
                      beneficiaryIds: [...selectedBeneficiaryIds],
                    })
                  }
                >
                  {removeBeneficiaries.isPending ? "Removing…" : "Remove"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {canManage && (
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Select all removable beneficiaries"
                    checked={allRemovableSelected}
                    disabled={removableItems.length === 0}
                    onCheckedChange={(checked) =>
                      toggleSelectAll(checked === true)
                    }
                  />
                </TableHead>
              )}
              <TableHead className="text-xs font-medium text-muted-foreground">
                Fisherfolk
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                ID Number
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Household
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Verified By
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Verified At
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Location
              </TableHead>
              {canManage && (
                <TableHead className="text-right text-xs font-medium text-muted-foreground">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((b) => {
              const isRemovable = b.verificationStatus === "PENDING";
              return (
                <TableRow key={b.id}>
                  {canManage && (
                    <TableCell className="py-2">
                      <Checkbox
                        aria-label={`Select ${b.fisherfolk.fullName}`}
                        checked={selectedBeneficiaryIds.has(b.id)}
                        disabled={!isRemovable}
                        title={
                          isRemovable
                            ? undefined
                            : "Confirmed distribution — cannot bulk-remove"
                        }
                        onCheckedChange={(checked) =>
                          toggleSelectOne(b.id, checked === true)
                        }
                      />
                    </TableCell>
                  )}
                  <TableCell className="py-2 text-sm font-medium">
                    <Link
                      href={tenantHref(`/fisherfolk/${b.fisherfolk.id}`)}
                      className="text-primary hover:underline"
                    >
                      {b.fisherfolk.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="py-2 text-sm">
                    {b.fisherfolk?.idNumber ?? "—"}
                  </TableCell>
                  <TableCell className="py-2 text-sm">
                    {b.household?.householdNumber ?? "—"}
                  </TableCell>
                  <TableCell className="py-2 text-sm">
                    <StatusBadge status={b.verificationStatus} />
                  </TableCell>
                  <TableCell className="py-2 text-sm">
                    {b.verifiedBy?.name ?? "—"}
                  </TableCell>
                  <TableCell className="py-2 text-sm">
                    {formatDate(b.verifiedAt)}
                  </TableCell>
                  <TableCell className="py-2 text-sm">
                    {b.latitude != null && b.longitude != null ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1 px-2 text-xs"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <LocationPicker
                            disabled
                            value={{ lat: b.latitude, lng: b.longitude }}
                            onChange={() => {}}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell className="py-2 text-right text-sm">
                      {b.verificationStatus === "PENDING" ? (
                        <BeneficiaryActions
                          beneficiaryId={b.id}
                          onVerify={verify.mutate}
                          isPending={verify.isPending}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function AyudaDetailClient({ id, canManage }: Props) {
  const tenantHref = useTenantHref();
  const utils = trpc.useUtils();
  const [closeOpen, setCloseOpen] = useState(false);

  const {
    data: record,
    isLoading,
    isError,
    error,
  } = trpc.ayuda.getProgramById.useQuery({ id });

  const publish = trpc.ayuda.publishProgram.useMutation({
    onSuccess: () => {
      toast.success("Program published.");
      void utils.ayuda.getProgramById.invalidate({ id });
      void utils.ayuda.listPrograms.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to publish program.");
    },
  });

  const close = trpc.ayuda.closeProgram.useMutation({
    onSuccess: () => {
      toast.success("Program closed.");
      setCloseOpen(false);
      void utils.ayuda.getProgramById.invalidate({ id });
      void utils.ayuda.listPrograms.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to close program.");
    },
  });

  const [pending, setPending] = useState<UploadedAttachment[]>([]);

  const addUploads = trpc.ayuda.addUploads.useMutation({
    onSuccess: () => {
      setPending([]);
      void utils.ayuda.getProgramById.invalidate({ id });
      toast.success("Files uploaded.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to upload files.");
    },
  });

  const removeUpload = trpc.ayuda.removeUpload.useMutation({
    onSuccess: () => {
      void utils.ayuda.getProgramById.invalidate({ id });
      toast.success("File removed.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to remove file.");
    },
  });

  const handleRemove = (item: AttachmentItem) => {
    if (!item.id) return;
    removeUpload.mutate({ uploadId: item.id });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading program…</p>;
  }

  if (isError) {
    const notFound = error?.data?.code === "NOT_FOUND";
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={tenantHref("/ayuda")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {notFound ? "Program not found." : "Failed to load program."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) return null;

  const canAddBeneficiary = canManage && record.status === "ACTIVE";

  return (
    <div className="space-y-4 pb-4">
      <RecordHeader
        backHref={tenantHref("/ayuda")}
        backLabel="Back to ayuda programs"
        title={record.title}
        meta={`Created ${formatDate(record.createdAt)}`}
        badge={<StatusBadge status={record.status} />}
        actions={
          <>
            {canManage && (
              <MakeTodoDialog
                sourceEntityType="ayudaProgram"
                sourceEntityId={id}
                defaultTitle={`Ayuda schedule: ${record.title}`}
              />
            )}
            {canManage && record.status === "DRAFT" && (
              <Button
                size="sm"
                onClick={() => publish.mutate({ id })}
                disabled={publish.isPending}
              >
                {publish.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Publish
              </Button>
            )}
            {canManage && record.status === "ACTIVE" && (
              <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    Close Program
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Close Program</DialogTitle>
                    <DialogDescription>
                      Mark this program as completed once distribution is done, or
                      cancel it if it will not proceed. This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        close.mutate({ id, status: "CANCELLED" })
                      }
                      disabled={close.isPending}
                    >
                      {close.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Cancel Program
                    </Button>
                    <Button
                      onClick={() =>
                        close.mutate({ id, status: "COMPLETED" })
                      }
                      disabled={close.isPending}
                    >
                      {close.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Mark Completed
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        }
      />

      {/* Program Details — full-width primary card (absorbs Summary) */}
      <Card className="gap-0 py-5">
        <CardHeader className="px-6 pb-4 pt-0">
          <CardTitle className="text-sm font-medium">
            Program Details
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-0">
          <DefinitionGrid columns={3}>
            <DetailField label="Title" value={record.title} />
            <DetailField label="Status" value={record.status} />
            <DetailField
              label="Beneficiaries"
              value={record.beneficiaryCount.toLocaleString()}
            />
            <DetailField label="Created By" value={record.createdBy?.name} />
            <DetailField
              label="Date Created"
              value={formatDate(record.createdAt)}
            />
            <DetailField label="Description" value={record.description} />
          </DefinitionGrid>
        </CardContent>
      </Card>

      {/* Files + Beneficiaries — responsive grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-0 py-5">
          <CardHeader className="px-6 pb-4 pt-0">
            <CardTitle className="text-sm font-medium">
              Program Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-0">
            <AttachmentList
              attachments={(record.uploads ?? []).map((u) => ({
                id: u.id,
                filePath: u.filePath,
                originalFilename: u.originalFilename,
                mimeType: u.mimeType ?? "",
              }))}
              emptyText="No files uploaded."
              {...(canManage ? { onRemove: handleRemove } : {})}
            />
            {canManage && (
              <div className="space-y-3 border-t pt-4">
                <AttachmentUpload
                  entityType="ayuda-upload"
                  value={pending}
                  onChange={setPending}
                />
                <Button
                  size="sm"
                  disabled={pending.length === 0 || addUploads.isPending}
                  onClick={() =>
                    addUploads.mutate({ programId: id, files: pending })
                  }
                >
                  {addUploads.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Files
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 py-5 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-4 pt-0">
            <CardTitle className="text-sm font-medium">
              Beneficiaries
            </CardTitle>
            {canAddBeneficiary && (
              <div className="flex items-center gap-2">
                <BulkFilterDialog
                  programId={record.id}
                  distributionUnit={record.distributionUnit}
                  canManage={canManage}
                  onChanged={() => {
                    void utils.ayuda.listBeneficiaries.invalidate({
                      programId: record.id,
                    });
                    void utils.ayuda.getProgramById.invalidate({
                      id: record.id,
                    });
                  }}
                />
                <AddBeneficiaryDialog
                  programId={record.id}
                  distributionUnit={record.distributionUnit}
                />
              </div>
            )}
          </CardHeader>
          <CardContent className="px-6 py-0">
            <BeneficiariesTable programId={record.id} canManage={canManage} />
          </CardContent>
        </Card>
      </div>

      {/* Linked ToDos */}
      <LinkedTodos sourceEntityType="ayudaProgram" sourceEntityId={id} />
    </div>
  );
}
