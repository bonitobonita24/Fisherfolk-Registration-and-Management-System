"use client";

import { useState, type ReactNode } from "react";
import { Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import type { SourceEntityType } from "@/lib/todo-source";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type KanbanPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

const PRIORITY_OPTIONS: { value: KanbanPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export interface MakeTodoDialogProps {
  sourceEntityType: SourceEntityType;
  sourceEntityId: string;
  defaultTitle: string;
  trigger?: ReactNode;
}

export function MakeTodoDialog({
  sourceEntityType,
  sourceEntityId,
  defaultTitle,
  trigger,
}: MakeTodoDialogProps) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<KanbanPriority>("MEDIUM");
  const [assignedToId, setAssignedToId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const usersQuery = trpc.user.listAssignable.useQuery(undefined, {
    enabled: open,
  });

  const create = trpc.kanbanTask.create.useMutation({
    onSuccess: () => {
      toast.success("ToDo created.");
      handleOpenChange(false);
      void utils.kanbanTask.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create ToDo.");
    },
  });

  function resetForm() {
    setTitle(defaultTitle);
    setDescription("");
    setPriority("MEDIUM");
    setAssignedToId("");
    setDueDate("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      resetForm();
    }
  }

  function handleSubmit() {
    if (title.trim() === "") return;
    create.mutate({
      title: title.trim(),
      description: description.trim() === "" ? undefined : description.trim(),
      priority,
      assignedToId: assignedToId === "" ? undefined : assignedToId,
      dueDate: dueDate === "" ? undefined : new Date(dueDate),
      sourceEntityType,
      sourceEntityId,
    });
  }

  const users = usersQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <ClipboardList className="mr-2 h-4 w-4" aria-hidden="true" />
            Make ToDo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Make ToDo</DialogTitle>
          <DialogDescription>
            Create a follow-up task linked to this record.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="make-todo-title">Title</Label>
            <Input
              id="make-todo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ToDo title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make-todo-due-date">Due date</Label>
              <Input
                id="make-todo-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="make-todo-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as KanbanPriority)}
              >
                <SelectTrigger id="make-todo-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="make-todo-assignee">Assignee</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger id="make-todo-assignee">
                <SelectValue
                  placeholder={
                    usersQuery.isLoading ? "Loading…" : "Assign to me"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name ?? u.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="make-todo-description">Description</Label>
            <Textarea
              id="make-todo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={title.trim() === "" || create.isPending}
          >
            {create.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Create ToDo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
