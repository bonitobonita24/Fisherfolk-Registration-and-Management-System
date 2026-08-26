"use client";

import Link from "next/link";

import { trpc } from "@/lib/trpc/client";
import {
  formatDueDate,
  isOverdue,
  URGENT_DESTRUCTIVE_CLASS,
} from "@/lib/todo-source";
import type { SourceEntityType } from "@/lib/todo-source";
import { useTenantHref } from "@/lib/use-tenant-href";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type KanbanStatus = "TODO" | "IN_PROGRESS" | "DONE";

const STATUS_LABEL: Record<KanbanStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

function statusBadgeVariant(status: KanbanStatus) {
  switch (status) {
    case "TODO":
      return "outline" as const;
    case "IN_PROGRESS":
      return "default" as const;
    case "DONE":
      return "secondary" as const;
  }
}

export interface LinkedTodosProps {
  sourceEntityType: SourceEntityType;
  sourceEntityId: string;
}

export function LinkedTodos({
  sourceEntityType,
  sourceEntityId,
}: LinkedTodosProps) {
  const tenantHref = useTenantHref();
  const { data, isLoading } = trpc.kanbanTask.list.useQuery({
    sourceEntityType,
    sourceEntityId,
    limit: 50,
  });

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">ToDos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-10 w-full rounded-md bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No todos yet.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <li key={task.id}>
                  <Link
                    href={tenantHref("/todo")}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex-1 min-w-0 truncate font-medium text-foreground">
                      {task.title}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={statusBadgeVariant(task.status)}
                        className="text-xs"
                      >
                        {STATUS_LABEL[task.status]}
                      </Badge>
                      {task.dueDate !== null && (
                        <Badge
                          variant={overdue ? undefined : "outline"}
                          className={`text-xs font-normal ${overdue ? URGENT_DESTRUCTIVE_CLASS : ""}`}
                        >
                          {overdue ? "Overdue: " : "Due "}
                          {formatDueDate(task.dueDate)}
                        </Badge>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
