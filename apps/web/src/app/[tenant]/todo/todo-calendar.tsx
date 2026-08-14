"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import {
  addMonths,
  isOverdue,
  monthMatrix,
  sameDay,
  startOfDay,
  URGENT_DESTRUCTIVE_CLASS,
  WEEKDAY_LABELS,
} from "@/lib/todo-source";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskDetailDialog } from "./todo-board-client";

function CalendarGridSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }, (_, i) => i).map((i) => (
        <div
          key={i}
          className="h-20 w-full rounded-md bg-muted animate-pulse"
        />
      ))}
    </div>
  );
}

function UndatedListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-8 w-full rounded-md bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export function TodoCalendar({ assignedToMe }: { assignedToMe: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const { data, isLoading } = trpc.kanbanTask.list.useQuery({
    page: 1,
    limit: 200,
    assignedToMe: assignedToMe ? true : undefined,
  });

  const items = data?.items ?? [];

  const weeks = useMemo(
    () => monthMatrix(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<number, typeof items>();
    for (const task of items) {
      if (task.dueDate === null || task.dueDate === undefined) {
        continue;
      }
      const due =
        typeof task.dueDate === "string" ? new Date(task.dueDate) : task.dueDate;
      if (due.getFullYear() !== cursor.year || due.getMonth() !== cursor.month) {
        continue;
      }
      const key = due.getDate();
      const existing = map.get(key) ?? [];
      existing.push(task);
      map.set(key, existing);
    }
    return map;
  }, [items, cursor.year, cursor.month]);

  const undated = useMemo(
    () => items.filter((t) => t.dueDate === null || t.dueDate === undefined),
    [items],
  );

  const today = startOfDay(new Date());
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "en-PH",
    { month: "long", year: "numeric" },
  );

  function goPrev() {
    setCursor((c) => addMonths(c.year, c.month, -1));
  }

  function goNext() {
    setCursor((c) => addMonths(c.year, c.month, 1));
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
      <Card>
        <CardHeader className="border-b px-6 py-5">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span>No Due Date</span>
            <Badge variant="outline" className="text-[11px] tabular-nums">
              {undated.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {isLoading ? (
            <UndatedListSkeleton />
          ) : undated.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Nothing undated
            </p>
          ) : (
            <ul className="space-y-1">
              {undated.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(task.id)}
                    aria-label={`${task.title}, no due date`}
                    className="w-full rounded-md border px-2 py-1.5 text-left text-xs hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {task.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-5">
          <CardTitle className="text-sm font-medium">{monthLabel}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goPrev}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goNext}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {isLoading ? (
            <CalendarGridSkeleton />
          ) : (
            <table
              className="w-full table-fixed border-collapse text-sm"
              aria-label={`Calendar for ${monthLabel}`}
            >
              <thead>
                <tr>
                  {WEEKDAY_LABELS.map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="w-[14.28%] pb-2 text-center text-xs font-medium text-muted-foreground"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, weekIdx) => (
                  <tr key={weekIdx}>
                    {week.map((cell, cellIdx) => {
                      if (cell === null) {
                        return (
                          <td
                            key={cellIdx}
                            className="h-24 border border-transparent align-top p-1"
                          />
                        );
                      }

                      const isToday = sameDay(cell, today);
                      const dayTasks = tasksByDay.get(cell.getDate()) ?? [];
                      const cellLabel = cell.toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                      });

                      return (
                        <td
                          key={cellIdx}
                          className={`h-24 align-top border p-1 ${
                            isToday ? "border-primary ring-2 ring-primary" : "border-border"
                          }`}
                        >
                          <div className="flex h-full flex-col gap-1">
                            <span
                              className={`text-[11px] ${
                                isToday
                                  ? "font-semibold text-primary"
                                  : "text-muted-foreground"
                              }`}
                              aria-label={isToday ? `${cellLabel}, today` : cellLabel}
                            >
                              {cell.getDate()}
                            </span>
                            <div className="flex flex-col gap-0.5 overflow-y-auto">
                              {dayTasks.map((task) => {
                                const overdue =
                                  task.dueDate !== null &&
                                  task.dueDate !== undefined &&
                                  isOverdue(task.dueDate, task.status);
                                return (
                                  <button
                                    key={task.id}
                                    type="button"
                                    onClick={() => setSelectedId(task.id)}
                                    aria-label={`${task.title}, due ${cellLabel}${
                                      overdue ? ", overdue" : ""
                                    }`}
                                    className={`truncate rounded px-1 py-0.5 text-left text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                      overdue
                                        ? URGENT_DESTRUCTIVE_CLASS
                                        : "bg-primary/10 text-primary"
                                    }`}
                                  >
                                    {task.title}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <TaskDetailDialog
        taskId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
