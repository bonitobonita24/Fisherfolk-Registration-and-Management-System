"use client";

import { useState } from "react";
import { Pencil, Copy, Archive, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TemplateManagerProps {
  canManage: boolean;
  onEditTemplate: (id: string) => void;
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TemplateManager({
  canManage,
  onEditTemplate,
}: TemplateManagerProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: templates = [], isLoading } = trpc.idTemplate.list.useQuery();

  const duplicate = trpc.idTemplate.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Template duplicated.");
      void utils.idTemplate.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Duplicate failed."),
  });

  const archive = trpc.idTemplate.update.useMutation({
    onSuccess: () => {
      toast.success("Template archived.");
      void utils.idTemplate.list.invalidate();
      void utils.idTemplate.getActive.invalidate();
    },
    onError: (err) => toast.error(err.message || "Archive failed."),
  });

  const setActive = trpc.idTemplate.setActive.useMutation({
    onSuccess: (data) => {
      toast.success(
        `"${data.name}" is now the active template — the ID Generator will use it.`,
      );
      void utils.idTemplate.list.invalidate();
      void utils.idTemplate.getActive.invalidate();
    },
    onError: (err) => toast.error(err.message || "Set active failed."),
  });

  const remove = trpc.idTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted.");
      setDeleteId(null);
      void utils.idTemplate.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Delete failed."),
  });

  function handleArchive(id: string) {
    archive.mutate({ id, data: { id, status: "ARCHIVED" } });
  }

  function handleDeleteConfirm() {
    if (deleteId) remove.mutate({ id: deleteId });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading templates…
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No templates yet. Create one above.
      </p>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Name</TableHead>
              <TableHead className="w-28 border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Type</TableHead>
              <TableHead className="w-24 border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Status</TableHead>
              <TableHead className="w-32 border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Updated</TableHead>
              {canManage && (
                <TableHead className="w-64 border-r px-3 text-right text-xs font-medium text-muted-foreground last:border-r-0">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((tpl) => (
              <TableRow key={tpl.id}>
                <TableCell className="border-r px-3 py-2 text-sm font-medium last:border-r-0">{tpl.name}</TableCell>
                <TableCell className="border-r px-3 py-2 text-xs text-muted-foreground capitalize last:border-r-0">
                  {tpl.templateType.toLowerCase()}
                </TableCell>
                <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
                  {tpl.status === "ACTIVE" ? (
                    <Badge className="gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {tpl.status.toLowerCase()}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="border-r px-3 py-2 text-xs text-muted-foreground last:border-r-0">
                  {formatDate(tpl.updatedAt)}
                </TableCell>
                {canManage && (
                  <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
                    <div className="flex justify-end gap-1">
                      {/* Set Active (only when not already active) */}
                      {tpl.status !== "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => setActive.mutate({ id: tpl.id })}
                          disabled={setActive.isPending}
                          aria-label={`Set ${tpl.name} as the active template`}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                          Set Active
                        </Button>
                      )}

                      {/* Edit */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onEditTemplate(tpl.id)}
                        aria-label={`Edit ${tpl.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      {/* Duplicate */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => duplicate.mutate({ id: tpl.id })}
                        disabled={duplicate.isPending}
                        aria-label={`Duplicate ${tpl.name}`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>

                      {/* Archive (only if ACTIVE) */}
                      {tpl.status === "ACTIVE" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleArchive(tpl.id)}
                          disabled={archive.isPending}
                          aria-label={`Archive ${tpl.name}`}
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* Delete */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          setDeleteId(tpl.id);
                          setDeleteName(tpl.name);
                        }}
                        aria-label={`Delete ${tpl.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteName}</span>? This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteId(null)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={remove.isPending}
            >
              {remove.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
