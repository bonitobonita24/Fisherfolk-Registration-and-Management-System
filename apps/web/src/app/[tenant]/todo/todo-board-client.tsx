"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Link2, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { formatDueDate, isOverdue, sourceEntityLink } from "@/lib/todo-source";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type KanbanStatus = "TODO" | "IN_PROGRESS" | "DONE";
type KanbanPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

const COLUMNS: { status: KanbanStatus; label: string }[] = [
  { status: "TODO", label: "To Do" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
];

const STATUS_LABEL: Record<KanbanStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const PRIORITY_OPTIONS: { value: KanbanPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function priorityBadge(priority: KanbanPriority) {
  switch (priority) {
    case "LOW":
      return (
        <Badge variant="secondary" className="text-xs">
          Low
        </Badge>
      );
    case "MEDIUM":
      return (
        <Badge variant="default" className="text-xs">
          Medium
        </Badge>
      );
    case "HIGH":
      return (
        <Badge
          variant="outline"
          className="border-orange-500 text-orange-500 text-xs"
        >
          High
        </Badge>
      );
    case "URGENT":
      return (
        <Badge variant="destructive" className="text-xs">
          Urgent
        </Badge>
      );
  }
}

function DueDateChip({
  dueDate,
  status,
}: {
  dueDate: Date | string;
  status: KanbanStatus;
}) {
  const overdue = isOverdue(dueDate, status);
  return (
    <Badge
      variant={overdue ? "destructive" : "outline"}
      className="text-xs font-normal"
    >
      {overdue ? "Overdue: " : "Due "}
      {formatDueDate(dueDate)}
    </Badge>
  );
}

function SourceLink({
  sourceEntityType,
  sourceEntityId,
}: {
  sourceEntityType: string | null;
  sourceEntityId: string | null;
}) {
  const { tenant } = useParams<{ tenant: string }>();
  const link = sourceEntityLink(sourceEntityType, sourceEntityId, tenant);
  if (!link) return null;

  return (
    <Link
      href={link.href}
      onClick={(e) => e.stopPropagation()}
      className="relative z-10 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
    >
      <Link2 className="h-3 w-3" aria-hidden="true" />
      {link.label}
    </Link>
  );
}

function NewTaskDialog() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<KanbanPriority>("MEDIUM");
  const [status, setStatus] = useState<KanbanStatus>("TODO");
  const [assignedToId, setAssignedToId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const usersQuery = trpc.user.list.useQuery(
    { limit: 200 },
    { enabled: open },
  );

  const create = trpc.kanbanTask.create.useMutation({
    onSuccess: () => {
      toast.success("Task created.");
      handleOpenChange(false);
      void utils.kanbanTask.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create task.");
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setStatus("TODO");
      setAssignedToId("");
      setDueDate("");
    }
  }

  function handleSubmit() {
    if (!title.trim() || !assignedToId) return;
    create.mutate({
      assignedToId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
  }

  const users = usersQuery.data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>
            Create a task and assign it to a team member.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as KanbanPriority)}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as KanbanStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((c) => (
                    <SelectItem key={c.status} value={c.status}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-due-date">Due date</Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    usersQuery.isLoading ? "Loading…" : "Select a member"
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
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !assignedToId || create.isPending}
          >
            {create.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MoveMenu({
  task,
  onMove,
  disabled,
}: {
  task: { id: string; status: KanbanStatus };
  onMove: (id: string, status: KanbanStatus) => void;
  disabled: boolean;
}) {
  const others = COLUMNS.filter((c) => c.status !== task.status);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          aria-label="Move task"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        {others.map((c) => (
          <DropdownMenuItem
            key={c.status}
            onClick={(e) => {
              e.stopPropagation();
              onMove(task.id, c.status);
            }}
          >
            {c.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TaskCard({
  task,
  onSelect,
  canManage,
  onMove,
  isMoving,
}: {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: KanbanStatus;
    priority: KanbanPriority;
    dueDate: Date | string | null;
    sourceEntityType: string | null;
    sourceEntityId: string | null;
    createdAt: Date;
    assignedTo: { id: string; name: string | null } | null;
  };
  onSelect: (id: string) => void;
  canManage: boolean;
  onMove: (id: string, status: KanbanStatus) => void;
  isMoving: boolean;
}) {
  return (
    <Card
      className="relative shadow-sm cursor-pointer transition-colors hover:bg-accent"
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-snug">
            <button
              type="button"
              onClick={() => onSelect(task.id)}
              className="text-left after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {task.title}
            </button>
          </CardTitle>
          <div className="relative z-10 flex items-center gap-1">
            {priorityBadge(task.priority)}
            {canManage && (
              <MoveMenu task={task} onMove={onMove} disabled={isMoving} />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-1">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        {task.assignedTo?.name && (
          <p className="text-xs text-muted-foreground">
            Assignee:{" "}
            <span className="font-medium text-foreground">
              {task.assignedTo.name}
            </span>
          </p>
        )}
        {(task.dueDate !== null || task.sourceEntityType !== null) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {task.dueDate !== null && (
              <DueDateChip dueDate={task.dueDate} status={task.status} />
            )}
            <SourceLink
              sourceEntityType={task.sourceEntityType}
              sourceEntityId={task.sourceEntityId}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ColumnSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 w-full rounded-lg bg-muted animate-pulse"
        />
      ))}
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-foreground">{children}</dd>
    </div>
  );
}

function TaskDetailDialog({
  taskId,
  open,
  onOpenChange,
}: {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: task, isLoading } = trpc.kanbanTask.getById.useQuery(
    { id: taskId ?? "" },
    { enabled: open && !!taskId },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {isLoading || !task ? (
          <div className="space-y-3 py-2">
            <DialogHeader className="sr-only">
              <DialogTitle>Task details</DialogTitle>
              <DialogDescription>Loading task details…</DialogDescription>
            </DialogHeader>
            <div className="h-6 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3">
                <DialogTitle className="leading-snug">{task.title}</DialogTitle>
                {priorityBadge(task.priority)}
              </div>
              <DialogDescription>
                {STATUS_LABEL[task.status]}
              </DialogDescription>
            </DialogHeader>

            <Separator />

            <dl className="space-y-3">
              <DetailRow label="Status">
                <Badge variant="outline" className="text-xs">
                  {STATUS_LABEL[task.status]}
                </Badge>
              </DetailRow>
              <DetailRow label="Assignee">
                {task.assignedTo?.name ?? (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </DetailRow>
              {task.dueDate !== null && (
                <DetailRow label="Due date">
                  <DueDateChip dueDate={task.dueDate} status={task.status} />
                </DetailRow>
              )}
              {task.sourceEntityType !== null && (
                <DetailRow label="Source">
                  <SourceLink
                    sourceEntityType={task.sourceEntityType}
                    sourceEntityId={task.sourceEntityId}
                  />
                </DetailRow>
              )}
              <DetailRow label="Description">
                {task.description ? (
                  <span className="whitespace-pre-wrap">{task.description}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </DetailRow>
              {task.sourceComment?.content && (
                <DetailRow label="Source comment">
                  <span className="whitespace-pre-wrap italic">
                    {task.sourceComment.content}
                  </span>
                </DetailRow>
              )}
              <DetailRow label="Created">{formatDate(task.createdAt)}</DetailRow>
              <DetailRow label="Updated">{formatDate(task.updatedAt)}</DetailRow>
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function KanbanColumns({
  canManage,
  assignedToMe,
}: {
  canManage: boolean;
  assignedToMe: boolean;
}) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.kanbanTask.list.useQuery({
    page: 1,
    limit: 200,
    assignedToMe: assignedToMe ? true : undefined,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const move = trpc.kanbanTask.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Task moved.");
      void utils.kanbanTask.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to move task.");
    },
  });

  const handleMove = (id: string, status: KanbanStatus) =>
    move.mutate({ id, status });

  const itemsByStatus = (status: KanbanStatus) =>
    (data?.items ?? []).filter((t) => t.status === status);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map(({ status, label }) => (
          <div key={status} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">{label}</h2>
              {!isLoading && (
                <Badge variant="secondary" className="text-xs">
                  {itemsByStatus(status).length}
                </Badge>
              )}
            </div>

            <div className="rounded-lg bg-muted/40 p-2 space-y-2 min-h-[120px]">
              {isLoading ? (
                <ColumnSkeleton />
              ) : itemsByStatus(status).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No tasks
                </p>
              ) : (
                itemsByStatus(status).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelect={setSelectedId}
                    canManage={canManage}
                    onMove={handleMove}
                    isMoving={move.isPending}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskDetailDialog
        taskId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}

export function TodoBoardClient({ canManage }: { canManage: boolean }) {
  const [view, setView] = useState<"kanban" | "calendar">("kanban");
  const [assignedToMe, setAssignedToMe] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "calendar")}>
            <TabsList aria-label="ToDo view">
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs
            value={assignedToMe ? "mine" : "all"}
            onValueChange={(v) => setAssignedToMe(v === "mine")}
          >
            <TabsList aria-label="Task filter">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mine">Assigned to me</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {canManage && <NewTaskDialog />}
      </div>

      {view === "kanban" ? (
        <KanbanColumns canManage={canManage} assignedToMe={assignedToMe} />
      ) : (
        <div
          data-todo-calendar-slot
          className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
        >
          Calendar view — coming in the next update.
        </div>
      )}
    </div>
  );
}
