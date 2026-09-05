"use client";

import { useState, type ReactNode } from "react";
import { Check, Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { SourceEntityType } from "@/lib/todo-source";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type KanbanPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TaskKind = "TASK" | "EVENT";

const PRIORITY_OPTIONS: { value: KanbanPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

// Roles allowed to publish an agenda item to everyone (mirrors
// ANNOUNCE_ALLOWED_ROLES in server/trpc/routers/agenda.ts — every staff
// role except the read-only `viewer` tier). Kept in sync with the server
// gate; the server is still the source of truth (FORBIDDEN on mismatch).
const ANNOUNCE_ALLOWED_ROLES = new Set([
  "tenant_manager",
  "tenant_superadmin",
  "tenant_admin",
  "encoder",
  "bantay_dagat",
]);

export interface MakeTodoDialogProps {
  sourceEntityType?: SourceEntityType;
  sourceEntityId?: string;
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
  const [kind, setKind] = useState<TaskKind>("TASK");
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<KanbanPriority>("MEDIUM");
  const [assignedToId, setAssignedToId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [shareWithUserIds, setShareWithUserIds] = useState<string[]>([]);
  const [announce, setAnnounce] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const usersQuery = trpc.user.listAssignable.useQuery(undefined, {
    enabled: open,
  });
  const meQuery = trpc.user.me.useQuery(undefined, { enabled: open });

  const canAnnounce =
    meQuery.data?.role !== undefined &&
    ANNOUNCE_ALLOWED_ROLES.has(meQuery.data.role);

  const create = trpc.agenda.create.useMutation({
    onSuccess: () => {
      toast.success(kind === "EVENT" ? "Event created." : "ToDo created.");
      handleOpenChange(false);
      void utils.kanbanTask.list.invalidate();
      void utils.agenda.myAgenda.invalidate();
      void utils.agenda.upcoming.invalidate();
    },
    onError: (err) => {
      if (err.data?.code === "FORBIDDEN") {
        toast.error(
          "You don't have permission to announce this item. It was not created — please try again without Announce.",
        );
        return;
      }
      toast.error(err.message || "Failed to create ToDo.");
    },
  });

  function resetForm() {
    setKind("TASK");
    setTitle(defaultTitle);
    setDescription("");
    setPriority("MEDIUM");
    setAssignedToId("");
    setDueDate("");
    setStartAt("");
    setEndAt("");
    setAllDay(false);
    setShareWithUserIds([]);
    setAnnounce(false);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      resetForm();
    }
  }

  function toggleShareUser(userId: string) {
    setShareWithUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
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
      kind,
      startAt: startAt === "" ? undefined : new Date(startAt),
      endAt: kind === "EVENT" && endAt !== "" ? new Date(endAt) : undefined,
      allDay,
      shareWithUserIds:
        shareWithUserIds.length > 0 ? shareWithUserIds : undefined,
      audience: announce && canAnnounce ? "ANNOUNCED" : undefined,
    });
  }

  const users = usersQuery.data ?? [];
  const selectedShareUsers = users.filter((u) =>
    shareWithUserIds.includes(u.id),
  );

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
          <DialogTitle>{kind === "EVENT" ? "New Event" : "Make ToDo"}</DialogTitle>
          <DialogDescription>
            {sourceEntityType
              ? "Create a follow-up task linked to this record."
              : "Create a personal task or a scheduled event."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label id="make-todo-kind-label">Type</Label>
            <Tabs value={kind} onValueChange={(v) => setKind(v as TaskKind)}>
              <TabsList aria-labelledby="make-todo-kind-label" className="grid w-full grid-cols-2">
                <TabsTrigger value="TASK">Task</TabsTrigger>
                <TabsTrigger value="EVENT">Event</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="make-todo-title">Title</Label>
            <Input
              id="make-todo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {kind === "TASK" ? (
              <div className="space-y-2">
                <Label htmlFor="make-todo-due-date">Due date</Label>
                <Input
                  id="make-todo-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="make-todo-start-at">Start</Label>
                <Input
                  id="make-todo-start-at"
                  type={allDay ? "date" : "datetime-local"}
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </div>
            )}

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

          {kind === "EVENT" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make-todo-end-at">End (optional)</Label>
                <Input
                  id="make-todo-end-at"
                  type={allDay ? "date" : "datetime-local"}
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Checkbox
                  id="make-todo-all-day"
                  checked={allDay}
                  onCheckedChange={(v) => setAllDay(v === true)}
                />
                <Label htmlFor="make-todo-all-day" className="font-normal">
                  All day
                </Label>
              </div>
            </div>
          )}

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
            <Label htmlFor="make-todo-share-trigger">Share with (optional)</Label>
            <Popover open={shareOpen} onOpenChange={setShareOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="make-todo-share-trigger"
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={shareOpen}
                  className={cn(
                    "w-full justify-between font-normal",
                    shareWithUserIds.length === 0 && "text-muted-foreground",
                  )}
                >
                  {shareWithUserIds.length === 0
                    ? "No one — private"
                    : selectedShareUsers
                        .map((u) => u.name ?? u.username)
                        .join(", ")}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] rounded-xl border-border p-0"
                align="start"
              >
                <Command>
                  <CommandList>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {users.map((u) => (
                        <CommandItem
                          key={u.id}
                          value={u.name ?? u.username}
                          className="rounded-md"
                          onSelect={() => toggleShareUser(u.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              shareWithUserIds.includes(u.id)
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                            aria-hidden="true"
                          />
                          {u.name ?? u.username}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {canAnnounce && (
            <div className="flex items-start gap-2 rounded-md border p-3">
              <Checkbox
                id="make-todo-announce"
                checked={announce}
                onCheckedChange={(v) => setAnnounce(v === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="make-todo-announce" className="font-normal">
                  Announce to everyone
                </Label>
                <p className="text-xs text-muted-foreground">
                  Visible on everyone&apos;s calendar.
                </p>
              </div>
            </div>
          )}

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
            {kind === "EVENT" ? "Create Event" : "Create ToDo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
