"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Crown } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FisherfolkLite } from "./household-detail-client";

/**
 * "Add Family" dialog — collects a head + optional members drawn ONLY from
 * this household's existing members (safe default: matches the
 * `family.create` server invariant that members must belong to the same
 * household; the server separately rejects pulling in the head of another
 * family, surfaced here via a toast on error).
 */
export function AddFamilyDialog({
  householdId,
  head,
  members,
  open,
  onOpenChange,
  onCreated,
}: {
  householdId: string;
  head: FisherfolkLite;
  members: FisherfolkLite[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [headId, setHeadId] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const candidates = useMemo(() => {
    const seen = new Set<string>();
    const all: FisherfolkLite[] = [];
    for (const person of [head, ...members]) {
      if (seen.has(person.id)) continue;
      seen.add(person.id);
      all.push(person);
    }
    return all;
  }, [head, members]);

  useEffect(() => {
    if (open) {
      setHeadId(null);
      setMemberIds([]);
    }
  }, [open]);

  const createFamily = trpc.family.create.useMutation({
    onSuccess: () => {
      toast.success("Family created.");
      onOpenChange(false);
      onCreated();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to create family.");
    },
  });

  function toggleMember(id: string, checked: boolean) {
    setMemberIds((prev) =>
      checked ? [...prev, id] : prev.filter((m) => m !== id),
    );
  }

  function handleCreate() {
    if (!headId) return;
    createFamily.mutate({
      householdId,
      headId,
      memberIds: memberIds.filter((id) => id !== headId),
    });
  }

  const memberCandidates = candidates.filter((c) => c.id !== headId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Family</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Select the family head</Label>
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {candidates.map((person) => {
                const selected = person.id === headId;
                return (
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
                      variant={selected ? "default" : "outline"}
                      disabled={createFamily.isPending}
                      onClick={() => {
                        setHeadId(person.id);
                        setMemberIds((prev) =>
                          prev.filter((id) => id !== person.id),
                        );
                      }}
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      {selected ? "Head" : "Make Head"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Select members (optional)</Label>
            {!headId && (
              <p className="text-sm text-muted-foreground">
                Choose a head first.
              </p>
            )}
            {headId && memberCandidates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No other household members available.
              </p>
            )}
            {headId && memberCandidates.length > 0 && (
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {memberCandidates.map((person) => (
                  <label
                    key={person.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Checkbox
                      checked={memberIds.includes(person.id)}
                      disabled={createFamily.isPending}
                      onCheckedChange={(checked) =>
                        toggleMember(person.id, checked === true)
                      }
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {person.fullName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {person.idNumber} · {person.barangay}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createFamily.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!headId || createFamily.isPending}
            onClick={handleCreate}
          >
            {createFamily.isPending ? "Creating…" : "Create Family"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
