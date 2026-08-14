"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/shared/search-input";
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

type WizardStep = "head" | "members" | "review";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "head", label: "Head" },
  { key: "members", label: "Members" },
  { key: "review", label: "Review" },
];

// ── Local stepper header (aria-current on active step) ──────────────────────
function WizardStepper({ current }: { current: WizardStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex items-center" aria-label="Household creation steps">
      {STEPS.map((s, i) => {
        const isCurrent = s.key === current;
        const isDone = i < currentIndex;
        return (
          <li key={s.key} className="flex items-center">
            <div
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                isDone
                  ? "bg-primary text-primary-foreground"
                  : isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "ml-2 text-sm",
                i <= currentIndex ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-px w-10",
                  isDone ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
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
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
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
  const params = useParams<{ tenant: string }>();

  const [step, setStep] = useState<WizardStep>("head");

  const [headSearch, setHeadSearch] = useState("");
  const [head, setHead] = useState<FisherfolkLite | null>(null);

  const [memberSearch, setMemberSearch] = useState("");
  const [members, setMembers] = useState<FisherfolkLite[]>([]);

  const [barangay, setBarangay] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [defaultsApplied, setDefaultsApplied] = useState(false);

  const headResults = trpc.household.availableFisherfolk.useQuery(
    { search: headSearch },
    { enabled: step === "head" },
  );

  const memberResults = trpc.household.availableFisherfolk.useQuery(
    { search: memberSearch },
    { enabled: step === "members" },
  );

  const memberIds = useMemo(() => members.map((m) => m.id), [members]);

  const filteredMemberResults = useMemo(() => {
    if (!memberResults.data) return [];
    return memberResults.data.filter(
      (p) => p.id !== head?.id && !memberIds.includes(p.id),
    );
  }, [memberResults.data, head, memberIds]);

  const createHousehold = trpc.household.create.useMutation();

  function handleSelectHead(person: FisherfolkLite) {
    setHead(person);
    if (!defaultsApplied) {
      setBarangay(person.barangay);
      setDefaultsApplied(true);
    }
  }

  function handleAddMember(person: FisherfolkLite) {
    setMembers((prev) => [...prev, person]);
  }

  function handleRemoveMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function goToMembers() {
    if (!head) {
      toast.error("Select a household head to continue.");
      return;
    }
    setStep("members");
  }

  function goToReview() {
    setStep("review");
  }

  async function handleSave() {
    if (!head) {
      toast.error("Select a household head to continue.");
      setStep("head");
      return;
    }

    try {
      const result = await createHousehold.mutateAsync({
        headId: head.id,
        memberIds,
        barangay: barangay || undefined,
        address: address || undefined,
        notes: notes || undefined,
      });
      toast.success("Household created.");
      router.push(`/${params.tenant}/households/${result.id}`);
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
      <WizardStepper current={step} />

      {/* ── Step 1: Head ────────────────────────────────────────────────── */}
      {step === "head" && (
        <Card>
          <CardHeader className="border-b px-6 py-5">
            <CardTitle className="text-sm font-medium">Select Household Head</CardTitle>
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

            {head && (
              <div className="rounded-md border border-primary bg-primary/5 p-3">
                <p className="text-xs font-medium text-primary">
                  Selected head
                </p>
                <p className="font-medium text-foreground">{head.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {head.idNumber} · {head.barangay}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {headResults.isLoading && (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
              {!headResults.isLoading && headResults.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No unassigned fisherfolk found.
                </p>
              )}
              {headResults.data?.map((person) => (
                <FisherfolkResultRow
                  key={person.id}
                  person={person}
                  actionLabel={head?.id === person.id ? "Selected" : "Select"}
                  disabled={head?.id === person.id}
                  onSelect={() => handleSelectHead(person)}
                />
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <Button type="button" onClick={goToMembers} disabled={!head}>
                Next: Members
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Members ─────────────────────────────────────────────── */}
      {step === "members" && head && (
        <Card>
          <CardHeader className="border-b px-6 py-5">
            <CardTitle className="text-sm font-medium">Add Members</CardTitle>
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

            {members.length > 0 && (
              <div className="space-y-1.5">
                <Label>Selected members ({members.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => (
                    <Badge
                      key={m.id}
                      variant="secondary"
                      className="gap-1 py-1 pl-2 pr-1"
                    >
                      {m.fullName}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.id)}
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
                  onSelect={() => handleAddMember(person)}
                />
              ))}
            </div>

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

            <div className="flex justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("head")}
              >
                Back
              </Button>
              <Button type="button" onClick={goToReview}>
                Next: Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Review ──────────────────────────────────────────────── */}
      {step === "review" && head && (
        <Card>
          <CardHeader className="border-b px-6 py-5">
            <CardTitle className="text-sm font-medium">Review Household</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Head
              </p>
              <p className="font-medium text-foreground">{head.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {head.idNumber} · {head.barangay}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Members ({members.length})
              </p>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No additional members.
                </p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {members.map((m) => (
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("members")}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={createHousehold.isPending}
              >
                {createHousehold.isPending ? "Saving…" : "Save Household"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
