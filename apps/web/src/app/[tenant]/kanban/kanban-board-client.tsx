"use client";

import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type KanbanStatus = "TODO" | "IN_PROGRESS" | "DONE";
type KanbanPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

const COLUMNS: { status: KanbanStatus; label: string }[] = [
  { status: "TODO", label: "To Do" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
];

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
}) {
  return (
    <Card className="shadow-sm">
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

export function KanbanBoardClient() {
  const { data, isLoading } = trpc.kanbanTask.list.useQuery({
    page: 1,
    limit: 200,
  });

  const itemsByStatus = (status: KanbanStatus) =>
    (data?.items ?? []).filter((t) => t.status === status);

  return (
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
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
