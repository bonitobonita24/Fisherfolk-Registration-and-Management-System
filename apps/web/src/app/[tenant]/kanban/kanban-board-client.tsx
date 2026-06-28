"use client";

import { useState } from "react";

import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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

function TaskCard({
  task,
  onSelect,
}: {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: KanbanStatus;
    priority: KanbanPriority;
    createdAt: Date;
    assignedTo: { id: string; name: string | null } | null;
  };
  onSelect: (id: string) => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(task.id);
        }
      }}
      className="shadow-sm cursor-pointer transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-snug">
            {task.title}
          </CardTitle>
          {priorityBadge(task.priority)}
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
            <div className="h-6 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3">
                <DialogTitle className="leading-snug">{task.title}</DialogTitle>
                {priorityBadge(task.priority as KanbanPriority)}
              </div>
              <DialogDescription>
                {STATUS_LABEL[task.status as KanbanStatus]}
              </DialogDescription>
            </DialogHeader>

            <Separator />

            <dl className="space-y-3">
              <DetailRow label="Status">
                <Badge variant="outline" className="text-xs">
                  {STATUS_LABEL[task.status as KanbanStatus]}
                </Badge>
              </DetailRow>
              <DetailRow label="Assignee">
                {task.assignedTo?.name ?? (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </DetailRow>
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

export function KanbanBoardClient() {
  const { data, isLoading } = trpc.kanbanTask.list.useQuery({
    page: 1,
    limit: 200,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

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
