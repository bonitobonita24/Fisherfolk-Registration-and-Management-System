"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";

type Role = "tenant_admin" | "encoder" | "viewer" | "bantay_dagat";

const ROLES: { value: Role; label: string }[] = [
  { value: "tenant_admin", label: "Admin" },
  { value: "encoder", label: "Encoder" },
  { value: "viewer", label: "Viewer" },
  { value: "bantay_dagat", label: "Bantay Dagat" },
];

export interface ChangeRoleTarget {
  id: string;
  username: string;
  role: string;
}

interface ChangeRoleDialogProps {
  target: ChangeRoleTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

export function ChangeRoleDialog({
  target,
  open,
  onOpenChange,
  onChanged,
}: ChangeRoleDialogProps) {
  const [role, setRole] = useState<Role | "">("");

  useEffect(() => {
    if (target && ROLES.some((r) => r.value === target.role)) {
      setRole(target.role as Role);
    } else {
      setRole("");
    }
  }, [target]);

  const updateRole = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated.");
      onOpenChange(false);
      onChanged();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update role.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target || !role) return;
    updateRole.mutate({ id: target.id, role });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {target ? `Update the role for "${target.username}".` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cr-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as Role)}
              disabled={updateRole.isPending}
            >
              <SelectTrigger id="cr-role" className="h-9">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="w-52">
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {updateRole.error && (
            <p className="text-xs text-destructive">
              {updateRole.error.message ?? "An error occurred."}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={updateRole.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={updateRole.isPending || !role}>
              {updateRole.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
