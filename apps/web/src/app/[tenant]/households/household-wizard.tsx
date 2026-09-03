"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import { SearchInput } from "@/components/shared/search-input";
import { Stepper } from "@/components/shared/stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ── Types ──────────────────────────────────────────────────────────────────
interface FisherfolkLite {
  id: string;
  idNumber: string;
  fullName: string;
  barangay: string;
  categoryIds: string[];
}

type FamilySlot = {
  head: FisherfolkLite | null;
  members: FisherfolkLite[];
};

const MAX_FAMILIES = 3;

type StepPhase = "details" | "head" | "members" | "review";

interface StepDef {
  phase: StepPhase;
  familyIndex: number;
  label: string;
}

// ── Selectable fisherfolk result row ────────────────────────────────────────
function FisherfolkResultRow({
  person,
  onSelect,
  actionLabel,
  disabled,
}: {
  person: FisherfolkLite;
  onSelect: () => void;
  actionLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
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
        disabled={disabled}
        onClick={onSelect}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function HouseholdWizard() {
  const router = useRouter();
  const tenantHref = useTenantHref();

  const [families, setFamilies] = useState<FamilySlot[]>([
    { head: null, members: [] },
  ]);
  const [current, setCurrent] = useState<{
    phase: StepPhase;
    familyIndex: number;
  }>({ phase: "details", familyIndex: 0 });

  const [headSearch, setHeadSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const [barangay, setBarangay] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const steps = useMemo<StepDef[]>(() => {
    const list: StepDef[] = [
      { phase: "details", familyIndex: 0, label: "Household details" },
    ];
    families.forEach((_, i) => {
      list.push({
        phase: "head",
        familyIndex: i,
        label: `Family ${i + 1} head`,
      });
      list.push({
        phase: "members",
        familyIndex: i,
        label: `Family ${i + 1} members`,
      });
    });
    list.push({ phase: "review", familyIndex: 0, label: "Review" });
    return list;
  }, [families]);

  const currentIndex = steps.findIndex(
    (s) => s.phase === current.phase && s.familyIndex === current.familyIndex,
  );

  const activeFamily = families[current.familyIndex];

  const headResults = trpc.household.availableFisherfolk.useQuery(
    { search: headSearch },
    { enabled: current.phase === "head" },
  );

  const memberResults = trpc.household.availableFisherfolk.useQuery(
    { search: memberSearch },
    { enabled: current.phase === "members" },
  );

  // Ids picked by any family OTHER than `excludeIndex` — used to keep a
  // person from being selected into more than one family across the wizard.
  function pickedIdsExcept(excludeIndex: number): Set<string> {
    const ids = new Set<string>();
    families.forEach((f, i) => {
      if (i === excludeIndex) return;
      if (f.head) ids.add(f.head.id);
      f.members.forEach((m) => ids.add(m.id));
    });
    return ids;
  }

  // Ids picked across ALL families (head or member) — used to hide anyone
  // already assigned when searching for members.
  const allPickedIds = useMemo(() => {
    const ids = new Set<string>();
    families.forEach((f) => {
      if (f.head) ids.add(f.head.id);
      f.members.forEach((m) => ids.add(m.id));
    });
    return ids;
  }, [families]);

  const filteredHeadResults = useMemo(() => {
    if (!headResults.data) return [];
    const excluded = pickedIdsExcept(current.familyIndex);
    const ownMembers = new Set(
      (families[current.familyIndex]?.members ?? []).map((m) => m.id),
    );
    return headResults.data.filter(
      (p) => !excluded.has(p.id) && !ownMembers.has(p.id),
    );
  }, [headResults.data, families, current.familyIndex]);

  const filteredMemberResults = useMemo(() => {
    if (!memberResults.data) return [];
    return memberResults.data.filter((p) => !allPickedIds.has(p.id));
  }, [memberResults.data, allPickedIds]);

  const createHousehold = trpc.household.create.useMutation();
  const createFamily = trpc.family.create.useMutation();
  const isSaving = createHousehold.isPending || createFamily.isPending;

  function updateFamily(
    idx: number,
    updater: (f: FamilySlot) => FamilySlot,
  ) {
    setFamilies((prev) => prev.map((f, i) => (i === idx ? updater(f) : f)));
  }

  function handleSelectHead(idx: number, person: FisherfolkLite) {
    updateFamily(idx, (f) => ({ ...f, head: person }));
  }

  function handleAddMember(idx: number, person: FisherfolkLite) {
    updateFamily(idx, (f) => ({ ...f, members: [...f.members, person] }));
  }

  function handleRemoveMember(idx: number, id: string) {
    updateFamily(idx, (f) => ({
      ...f,
      members: f.members.filter((m) => m.id !== id),
    }));
  }

  function goToStep(idx: number) {
    const target = steps[idx];
    if (!target) return;
    setHeadSearch("");
    setMemberSearch("");
    setCurrent({ phase: target.phase, familyIndex: target.familyIndex });
  }

  function goNext() {
    if (current.phase === "head" && !activeFamily?.head) {
      toast.error("Select a family head to continue.");
      return;
    }
    goToStep(currentIndex + 1);
  }

  function goBack() {
    goToStep(currentIndex - 1);
  }

  function handleAddFamily() {
    if (families.length >= MAX_FAMILIES) return;
    const newIndex = families.length;
    setFamilies((prev) => [...prev, { head: null, members: [] }]);
    setHeadSearch("");
    setMemberSearch("");
    setCurrent({ phase: "head", familyIndex: newIndex });
  }

  function handleRemoveFamily(idx: number) {
    if (idx === 0) return;
    setFamilies((prev) => prev.filter((_, i) => i !== idx));
    setHeadSearch("");
    setMemberSearch("");
    setCurrent({ phase: "head", familyIndex: idx - 1 });
  }

  async function handleSave() {
    const missingHeadIndex = families.findIndex((f) => !f.head);
    if (missingHeadIndex !== -1) {
      toast.error(`Family ${missingHeadIndex + 1} needs a head to continue.`);
      goToStep(
        steps.findIndex(
          (s) => s.phase === "head" && s.familyIndex === missingHeadIndex,
        ),
      );
      return;
    }

    const [firstFamily, ...restFamilies] = families;
    if (!firstFamily?.head) return;

    try {
      const restIds = restFamilies.flatMap((f) => [
        ...(f.head ? [f.head.id] : []),
        ...f.members.map((m) => m.id),
      ]);

      const result = await createHousehold.mutateAsync({
        headId: firstFamily.head.id,
        memberIds: [...firstFamily.members.map((m) => m.id), ...restIds],
        barangay: barangay || undefined,
        address: address || undefined,
        notes: notes || undefined,
      });

      for (const family of restFamilies) {
        if (!family.head) continue;
        await createFamily.mutateAsync({
          householdId: result.id,
          headId: family.head.id,
          memberIds: family.members.map((m) => m.id),
        });
      }

      toast.success("Household created.");
      router.push(tenantHref(`/households/${result.id}`));
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to create household. Please try again.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <Stepper
        steps={steps.map((s) => s.label)}
        current={Math.max(currentIndex, 0)}
      />

      {/* ── Step: Household details ─────────────────────────────────────── */}
      {current.phase === "details" && (
        <Card>
          <CardHeader className="border-b px-6 py-5">
            <CardTitle className="text-sm font-medium">
              Household Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="household-barangay">Barangay</Label>
                <Input
                  id="household-barangay"
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="household-address">Address</Label>
                <Input
                  id="household-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="household-notes">Notes (optional)</Label>
              <Textarea
                id="household-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button type="button" onClick={goNext}>
                Next: Family 1 head
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step: Family head ───────────────────────────────────────────── */}
      {current.phase === "head" && activeFamily && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-5">
            <CardTitle className="text-sm font-medium">
              Select Family {current.familyIndex + 1} Head
            </CardTitle>
            {current.familyIndex > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveFamily(current.familyIndex)}
              >
                Remove family
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="head-search">Search fisherfolk</Label>
              <SearchInput
                value={headSearch}
                onChange={setHeadSearch}
                placeholder="Search by name or ID number..."
                className="w-full max-w-sm"
              />
            </div>

            {activeFamily.head && (
              <div className="rounded-lg border border-primary bg-primary/5 p-3">
                <p className="text-xs font-medium text-primary">
                  Selected head
                </p>
                <p className="font-medium text-foreground">
                  {activeFamily.head.fullName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeFamily.head.idNumber} · {activeFamily.head.barangay}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {headResults.isLoading && (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
              {!headResults.isLoading && filteredHeadResults.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No unassigned fisherfolk found.
                </p>
              )}
              {filteredHeadResults.map((person) => (
                <FisherfolkResultRow
                  key={person.id}
                  person={person}
                  actionLabel={
                    activeFamily.head?.id === person.id ? "Selected" : "Select"
                  }
                  disabled={activeFamily.head?.id === person.id}
                  onSelect={() => handleSelectHead(current.familyIndex, person)}
                />
              ))}
            </div>

            <div className="flex justify-between pt-1">
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
              <Button
                type="button"
                onClick={goNext}
                disabled={!activeFamily.head}
              >
                Next: Members
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step: Family members ────────────────────────────────────────── */}
      {current.phase === "members" && activeFamily && activeFamily.head && (
        <Card>
          <CardHeader className="border-b px-6 py-5">
            <CardTitle className="text-sm font-medium">
              Add Family {current.familyIndex + 1} Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="member-search">Search fisherfolk</Label>
              <SearchInput
                value={memberSearch}
                onChange={setMemberSearch}
                placeholder="Search by name or ID number..."
                className="w-full max-w-sm"
              />
            </div>

            {activeFamily.members.length > 0 && (
              <div className="space-y-1.5">
                <Label>Selected members ({activeFamily.members.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {activeFamily.members.map((m) => (
                    <Badge
                      key={m.id}
                      variant="secondary"
                      className="gap-1 py-1 pl-2 pr-1"
                    >
                      {m.fullName}
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveMember(current.familyIndex, m.id)
                        }
                        className="rounded-sm hover:bg-muted-foreground/20"
                        aria-label={`Remove ${m.fullName} from members`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {memberResults.isLoading && (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
              {!memberResults.isLoading &&
                filteredMemberResults.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No available fisherfolk found.
                  </p>
                )}
              {filteredMemberResults.map((person) => (
                <FisherfolkResultRow
                  key={person.id}
                  person={person}
                  actionLabel="Add"
                  onSelect={() => handleAddMember(current.familyIndex, person)}
                />
              ))}
            </div>

            <div className="flex flex-wrap justify-between gap-2 pt-1">
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
              <div className="flex gap-2">
                {current.familyIndex === families.length - 1 &&
                  families.length < MAX_FAMILIES && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddFamily}
                    >
                      Add another family (max {MAX_FAMILIES})
                    </Button>
                  )}
                <Button type="button" onClick={goNext}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step: Review ─────────────────────────────────────────────────── */}
      {current.phase === "review" && (
        <Card>
          <CardHeader className="border-b px-6 py-5">
            <CardTitle className="text-sm font-medium">Review Household</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-6 py-5">
            {families.map((family, i) => (
              <div key={i} className="rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Family {i + 1} head
                </p>
                {family.head ? (
                  <>
                    <p className="font-medium text-foreground">
                      {family.head.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {family.head.idNumber} · {family.head.barangay}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-destructive">No head selected.</p>
                )}
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  Members ({family.members.length})
                </p>
                {family.members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No additional members.
                  </p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {family.members.map((m) => (
                      <li key={m.id} className="text-sm text-foreground">
                        {m.fullName}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({m.idNumber})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Barangay
                </p>
                <p className="text-sm text-foreground">
                  {barangay || <span className="text-muted-foreground">—</span>}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Address
                </p>
                <p className="text-sm text-foreground">
                  {address || <span className="text-muted-foreground">—</span>}
                </p>
              </div>
            </div>

            {notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Notes
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {notes}
                </p>
              </div>
            )}

            <div className="flex justify-between pt-1">
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : "Save Household"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
