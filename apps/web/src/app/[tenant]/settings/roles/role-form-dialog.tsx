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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";

import { PermissionMatrix } from "./permission-matrix";
import {
  buildEmptyGrid,
  gridToPermissions,
  permissionsToGrid,
  validateRoleName,
  type PermissionGrid,
  type RawPermissionGrant,
} from "./matrix-transform";

export interface EditingRole {
  id: string;
  name: string;
  description: string | null;
  permissions: RawPermissionGrant[];
}

interface RoleFormDialogProps {
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; absent (null) = create mode. */
  editingRole: EditingRole | null;
  onSaved: () => void;
}

/**
 * Create/edit dialog for a custom role: name + description fields plus the
 * full permission matrix. Save calls `customRole.create` (no `id`) or
 * `customRole.update` (with `id`) depending on `editingRole`.
 */
export function RoleFormDialog({
  tenantId,
  open,
  onOpenChange,
  editingRole,
  onSaved,
}: RoleFormDialogProps) {
  const isEditMode = editingRole !== null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [grid, setGrid] = useState<PermissionGrid>(buildEmptyGrid());
  const [nameError, setNameError] = useState<string | null>(null);

  // Re-hydrate the form whenever the dialog opens for a (possibly different) role.
  useEffect(() => {
    if (!open) return;
    if (editingRole) {
      setName(editingRole.name);
      setDescription(editingRole.description ?? "");
      setGrid(permissionsToGrid(editingRole.permissions));
    } else {
      setName("");
      setDescription("");
      setGrid(buildEmptyGrid());
    }
    setNameError(null);
  }, [open, editingRole]);

  const create = trpc.customRole.create.useMutation({
    onSuccess: () => {
      toast.success("Custom role created.");
      onOpenChange(false);
      onSaved();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to create custom role.");
    },
  });

  const update = trpc.customRole.update.useMutation({
    onSuccess: () => {
      toast.success("Custom role updated.");
      onOpenChange(false);
      onSaved();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update custom role.");
    },
  });

  const isSaving = create.isPending || update.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validateRoleName(name);
    setNameError(error);
    if (error) return;

    const permissions = gridToPermissions(grid);

    if (editingRole !== null) {
      update.mutate({
        tenantId,
        id: editingRole.id,
        name: name.trim(),
        description: description.trim() || undefined,
        permissions,
      });
    } else {
      create.mutate({
        tenantId,
        name: name.trim(),
        description: description.trim() || undefined,
        permissions,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Custom Role" : "Create Custom Role"}</DialogTitle>
          <DialogDescription>
            Custom roles sit below Tenant Admin and can never grant Billing or
            User Management. Check a box to grant that action on that
            feature.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Role name</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="e.g. Field Supervisor"
                disabled={isSaving}
                maxLength={60}
                aria-describedby={nameError ? "role-name-err" : undefined}
                className="h-9"
              />
              {nameError && (
                <p id="role-name-err" className="text-xs text-destructive">
                  {nameError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-description">Description (optional)</Label>
              <Input
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this role for?"
                disabled={isSaving}
                maxLength={500}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-medium text-foreground">Permissions</h3>
            <PermissionMatrix grid={grid} onChange={setGrid} disabled={isSaving} />
          </div>

          {(create.error ?? update.error) && (
            <p className="text-xs text-destructive">
              {(create.error ?? update.error)?.message ?? "An error occurred."}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Saving…" : isEditMode ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
