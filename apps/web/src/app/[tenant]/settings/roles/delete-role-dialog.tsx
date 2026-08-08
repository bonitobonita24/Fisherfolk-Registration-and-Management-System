"use client";

import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc/client";

interface DeleteRoleDialogProps {
  tenantId: string;
  roleId: string | null;
  roleName: string;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

/**
 * Delete confirmation for a custom role. Surfaces the server's
 * `PRECONDITION_FAILED "N user(s) still assigned"` message verbatim on
 * failure (e.g. via toast) instead of a generic error, per Chunk 7 task.
 */
export function DeleteRoleDialog({
  tenantId,
  roleId,
  roleName,
  onOpenChange,
  onDeleted,
}: DeleteRoleDialogProps) {
  const deleteRole = trpc.customRole.delete.useMutation({
    onSuccess: () => {
      toast.success(`"${roleName}" deleted.`);
      onOpenChange(false);
      onDeleted();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to delete custom role.");
      onOpenChange(false);
    },
  });

  return (
    <AlertDialog open={roleId !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{roleName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the custom role and its permission
            matrix. Users currently assigned this role must be reassigned or
            cleared first — the deletion will be blocked otherwise.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRole.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteRole.isPending}
            onClick={() => {
              if (roleId) deleteRole.mutate({ tenantId, id: roleId });
            }}
          >
            {deleteRole.isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
