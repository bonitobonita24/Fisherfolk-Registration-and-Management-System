"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  HandHeart,
  Megaphone,
  Ship,
  Tag,
  User,
  Users,
} from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import {
  addMonths,
  isOverdue,
  monthMatrix,
  sameDay,
  SOURCE_ENTITY_LABELS,
  sourceEntityLink,
  startOfDay,
  URGENT_DESTRUCTIVE_CLASS,
  WEEKDAY_LABELS,
  type SourceEntityType,
} from "@/lib/todo-source";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { UnderlineTabsList, UnderlineTabsTrigger } from "@/components/shared";
import { TaskDetailDialog } from "../todo/todo-board-client";

// ── Types ────────────────────────────────────────────────────────────────
type AgendaStatus = "TODO" | "IN_PROGRESS" | "DONE";
type AgendaStream = "self" | "shared" | "announced" | "entity";
type SourceChipKey = "PERSONAL" | "EVENT" | SourceEntityType;

const STATUS_LABEL: Record<AgendaStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const STATUS_OPTIONS: { value: AgendaStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const SOURCE_OPTIONS: { key: SourceChipKey; label: string; icon: LucideIcon }[] = [
  { key: "PERSONAL", label: "Personal", icon: User },
  { key: "fisherfolk", label: SOURCE_ENTITY_LABELS.fisherfolk, icon: Users },
  { key: "vessel", label: SOURCE_ENTITY_LABELS.vessel, icon: Ship },
  { key: "violation", label: SOURCE_ENTITY_LABELS.violation, icon: AlertTriangle },
  { key: "ayudaProgram", label: SOURCE_ENTITY_LABELS.ayudaProgram, icon: HandHeart },
  { key: "EVENT", label: "Event", icon: CalendarDays },
];

// WCAG 2.2 AA — every stream pairs a colour with an icon + text label
// (colour is never the only signal). The 700-shade + white-text combo
// mirrors the URGENT_DESTRUCTIVE_CLASS precedent (todo-source.ts), which
// measures well above the 4.5:1 text-contrast floor in both themes.
const STREAM_CONFIG: Record<
  AgendaStream,
  { label: string; icon: LucideIcon; className: string }
> = {
  self: {
    label: "Personal",
    icon: User,
    className:
      "border-transparent bg-blue-700 text-white dark:bg-blue-700 dark:text-white",
  },
  shared: {
    label: "Shared",
    icon: Users,
    className:
      "border-transparent bg-violet-700 text-white dark:bg-violet-700 dark:text-white",
  },
  announced: {
    label: "Announced",
    icon: Megaphone,
    className:
      "border-transparent bg-amber-700 text-white dark:bg-amber-700 dark:text-white",
  },
  entity: {
    label: "Record",
    icon: Tag,
    className:
      "border-transparent bg-teal-700 text-white dark:bg-teal-700 dark:text-white",
  },
};

const ENTITY_ICONS: Record<SourceEntityType, LucideIcon> = {
  fisherfolk: Users,
  vessel: Ship,
  violation: AlertTriangle,
  ayudaProgram: HandHeart,
};

// ── Pure helpers ─────────────────────────────────────────────────────────
function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

function monthBounds(year: number, month: number): { from: Date; to: Date } {
  return {
    from: new Date(year, month, 1, 0, 0, 0, 0),
    to: new Date(year, month + 1, 0, 23, 59, 59, 999),
  };
}

function listBounds(): { from: Date; to: Date } {
  const from = startOfDay(new Date());
  const to = new Date(from);
  to.setDate(to.getDate() + 90);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

// ── Component ────────────────────────────────────────────────────────────
export function AgendaCalendarClient() {
  const tenantHref = useTenantHref();
  const [view, setView] = useState<"month" | "list">("month");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [focusedDay, setFocusedDay] = useState<number>(() => new Date().getDate());
  const [statusFilter, setStatusFilter] = useState<Set<AgendaStatus>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<Set<SourceChipKey>>(new Set());
  const [mineOnly, setMineOnly] = useState(false);

  const dayButtonRefs = useRef(new Map<number, HTMLButtonElement>());

  const bounds = useMemo(
    // listBounds() only changes day-to-day; recomputed when switching views.
    () => (view === "month" ? monthBounds(cursor.year, cursor.month) : listBounds()),
    [view, cursor.year, cursor.month],
  );

  const { data, isLoading } = trpc.agenda.myAgenda.useQuery({
    from: bounds.from,
    to: bounds.to,
    statuses: statusFilter.size > 0 ? Array.from(statusFilter) : undefined,
    mineOnly: mineOnly ? true : undefined,
  });

  const rows = data ?? [];
  type AgendaItem = (typeof rows)[number];

  const items = useMemo(() => {
    if (sourceFilter.size === 0) return rows;
    return rows.filter((item) => {
      if (item.kind === "EVENT") return sourceFilter.has("EVENT");
      if (item.sourceEntityType) {
        return sourceFilter.has(item.sourceEntityType as SourceEntityType);
      }
      return sourceFilter.has("PERSONAL");
    });
  }, [rows, sourceFilter]);

  const weeks = useMemo(
    () => monthMatrix(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const itemsByDay = useMemo(() => {
    const map = new Map<number, AgendaItem[]>();
    for (const item of items) {
      const raw = item.startAt ?? item.dueDate;
      if (raw === null || raw === undefined) continue;
      const d = toDate(raw);
      if (d.getFullYear() !== cursor.year || d.getMonth() !== cursor.month) continue;
      const key = d.getDate();
      const existing = map.get(key) ?? [];
      existing.push(item);
      map.set(key, existing);
    }
    return map;
  }, [items, cursor.year, cursor.month]);

  const listGroups = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of items) {
      const raw = item.startAt ?? item.dueDate;
      const key = raw ? toDate(raw).toDateString() : "undated";
      const existing = map.get(key) ?? [];
      existing.push(item);
      map.set(key, existing);
    }
    const entries = Array.from(map.entries());
    entries.sort(([a], [b]) => {
      if (a === "undated") return 1;
      if (b === "undated") return -1;
      return new Date(a).getTime() - new Date(b).getTime();
    });
    return entries;
  }, [items]);

  const today = startOfDay(new Date());
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "en-PH",
    { month: "long", year: "numeric" },
  );
  const liveAnnouncement =
    view === "month" ? `Month view — ${monthLabel}` : "List view — next 90 days";

  function goPrev() {
    setCursor((c) => addMonths(c.year, c.month, -1));
  }
  function goNext() {
    setCursor((c) => addMonths(c.year, c.month, 1));
  }
  function goToday() {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
    setFocusedDay(now.getDate());
  }

  function chipVisual(item: AgendaItem): {
    label: string;
    Icon: LucideIcon;
    className: string;
  } {
    const overdue =
      item.dueDate !== null &&
      item.dueDate !== undefined &&
      isOverdue(item.dueDate, item.status);
    if (overdue) {
      return { label: "Overdue", Icon: AlertCircle, className: URGENT_DESTRUCTIVE_CLASS };
    }
    if (item.stream === "entity" && item.sourceEntityType) {
      const entityType = item.sourceEntityType as SourceEntityType;
      return {
        label: SOURCE_ENTITY_LABELS[entityType],
        Icon: ENTITY_ICONS[entityType],
        className: STREAM_CONFIG.entity.className,
      };
    }
    const stream: AgendaStream = item.stream in STREAM_CONFIG ? item.stream : "self";
    const cfg = STREAM_CONFIG[stream];
    return { label: cfg.label, Icon: cfg.icon, className: cfg.className };
  }

  function handleDayKeyDown(e: KeyboardEvent<HTMLButtonElement>, cell: Date) {
    let deltaDays = 0;
    switch (e.key) {
      case "ArrowLeft":
        deltaDays = -1;
        break;
      case "ArrowRight":
        deltaDays = 1;
        break;
      case "ArrowUp":
        deltaDays = -7;
        break;
      case "ArrowDown":
        deltaDays = 7;
        break;
      case "Home":
        deltaDays = 1 - cell.getDate();
        break;
      case "End":
        deltaDays =
          new Date(cell.getFullYear(), cell.getMonth() + 1, 0).getDate() -
          cell.getDate();
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const dayItems = itemsByDay.get(cell.getDate()) ?? [];
        if (dayItems[0]) setSelectedId(dayItems[0].id);
        return;
      }
      default:
        return;
    }
    e.preventDefault();
    const target = new Date(
      cell.getFullYear(),
      cell.getMonth(),
      cell.getDate() + deltaDays,
    );
    if (target.getFullYear() === cursor.year && target.getMonth() === cursor.month) {
      setFocusedDay(target.getDate());
      requestAnimationFrame(() => {
        dayButtonRefs.current.get(target.getDate())?.focus();
      });
    }
  }

  function renderChipButton(item: AgendaItem, cellLabel: string, dense: boolean) {
    const { label, Icon, className } = chipVisual(item);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setSelectedId(item.id)}
        aria-label={`${item.title}, ${label}${cellLabel ? `, ${cellLabel}` : ""}, ${STATUS_LABEL[item.status] ?? item.status}`}
        className={`flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className} ${dense ? "" : "text-xs"}`}
      >
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{item.title}</span>
      </button>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* ── View switch + filters ─────────────────────────────────────── */}
      <Tabs value={view} onValueChange={(v) => setView(v as "month" | "list")}>
        <div className="flex flex-wrap items-center gap-2 border-b pb-2">
          <UnderlineTabsList aria-label="Calendar view" className="h-8 w-auto shrink-0 border-b-0 p-0">
            <UnderlineTabsTrigger value="month" className="h-8 px-3 text-xs">
              Month
            </UnderlineTabsTrigger>
            <UnderlineTabsTrigger value="list" className="h-8 px-3 text-xs">
              List
            </UnderlineTabsTrigger>
          </UnderlineTabsList>

          <Button
            type="button"
            variant={mineOnly ? "default" : "outline"}
            size="sm"
            aria-pressed={mineOnly}
            onClick={() => setMineOnly((v) => !v)}
            className="h-7 px-3 text-xs shadow-none"
          >
            Only mine
          </Button>

          <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-1">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={statusFilter.has(opt.value) ? "default" : "outline"}
                size="sm"
                aria-pressed={statusFilter.has(opt.value)}
                onClick={() => setStatusFilter((s) => toggleInSet(s, opt.value))}
                className="h-7 px-2.5 text-xs shadow-none"
              >
                {opt.label}
              </Button>
            ))}
          </div>

          <div role="group" aria-label="Filter by source" className="flex flex-wrap items-center gap-1">
            {SOURCE_OPTIONS.map((opt) => (
              <Button
                key={opt.key}
                type="button"
                variant={sourceFilter.has(opt.key) ? "default" : "outline"}
                size="sm"
                aria-pressed={sourceFilter.has(opt.key)}
                onClick={() => setSourceFilter((s) => toggleInSet(s, opt.key))}
                className="h-7 gap-1 px-2.5 text-xs shadow-none"
              >
                <opt.icon className="h-3 w-3" aria-hidden="true" />
                {opt.label}
              </Button>
            ))}
          </div>

          {view === "month" && (
            <div className="ml-auto flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={goToday}>
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={goPrev}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={goNext}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Month view ───────────────────────────────────────────────── */}
        <TabsContent value="month" className="mt-4">
          <Card>
            <CardHeader className="border-b px-6 py-5">
              <CardTitle className="text-sm font-medium">{monthLabel}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              {isLoading ? (
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => i).map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
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
                          const dayItems = itemsByDay.get(cell.getDate()) ?? [];
                          const cellLabel = cell.toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                          });
                          const visible = dayItems.slice(0, 3);
                          const overflow = dayItems.slice(3);
                          const isFocusTarget = cell.getDate() === focusedDay;

                          return (
                            <td
                              key={cellIdx}
                              className={`h-24 align-top border p-1 ${
                                isToday ? "border-primary ring-2 ring-primary" : "border-border"
                              }`}
                            >
                              <div className="flex h-full flex-col gap-1">
                                <button
                                  type="button"
                                  ref={(el) => {
                                    if (el) dayButtonRefs.current.set(cell.getDate(), el);
                                    else dayButtonRefs.current.delete(cell.getDate());
                                  }}
                                  tabIndex={isFocusTarget ? 0 : -1}
                                  onFocus={() => setFocusedDay(cell.getDate())}
                                  onKeyDown={(e) => handleDayKeyDown(e, cell)}
                                  onClick={() => {
                                    if (dayItems[0]) setSelectedId(dayItems[0].id);
                                  }}
                                  aria-label={
                                    isToday
                                      ? `${cellLabel}, today, ${dayItems.length} item${dayItems.length === 1 ? "" : "s"}`
                                      : `${cellLabel}, ${dayItems.length} item${dayItems.length === 1 ? "" : "s"}`
                                  }
                                  className={`w-fit rounded text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    isToday
                                      ? "font-semibold text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {cell.getDate()}
                                </button>
                                <div className="flex flex-col gap-0.5 overflow-y-auto">
                                  {visible.map((item) => renderChipButton(item, cellLabel, true))}
                                  {overflow.length > 0 && (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          type="button"
                                          className="truncate rounded px-1 py-0.5 text-left text-[10px] text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                          aria-label={`${overflow.length} more items on ${cellLabel}`}
                                        >
                                          +{overflow.length} more
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-64 space-y-1 p-2" align="start">
                                        {overflow.map((item) => renderChipButton(item, cellLabel, false))}
                                      </PopoverContent>
                                    </Popover>
                                  )}
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
        </TabsContent>

        {/* ── List view ────────────────────────────────────────────────── */}
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader className="border-b px-6 py-5">
              <CardTitle className="text-sm font-medium">Upcoming (next 90 days)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-6 py-5">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : listGroups.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nothing scheduled.
                </p>
              ) : (
                listGroups.map(([dateKey, groupItems]) => {
                  const heading =
                    dateKey === "undated"
                      ? "No date"
                      : new Date(dateKey).toLocaleDateString("en-PH", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                  return (
                    <section key={dateKey} aria-label={heading}>
                      <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        {heading}
                        <Badge variant="outline" className="text-[10px] tabular-nums">
                          {groupItems.length}
                        </Badge>
                      </h3>
                      <ul className="space-y-1.5">
                        {groupItems.map((item) => {
                          const { label, Icon, className } = chipVisual(item);
                          const link =
                            item.sourceEntityType && item.sourceEntityId
                              ? sourceEntityLink(item.sourceEntityType, item.sourceEntityId)
                              : null;
                          return (
                            <li
                              key={item.id}
                              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedId(item.id)}
                                aria-label={`${item.title}, ${label}, ${STATUS_LABEL[item.status] ?? item.status}`}
                                className="flex min-w-0 flex-1 items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <Badge className={`gap-1 px-1.5 py-0.5 text-[10px] ${className}`}>
                                  <Icon className="h-3 w-3" aria-hidden="true" />
                                  {label}
                                </Badge>
                                <span className="truncate text-sm text-foreground">{item.title}</span>
                              </button>
                              {link && (
                                <Link
                                  href={tenantHref(link.href)}
                                  className="shrink-0 text-xs text-primary underline-offset-2 hover:underline"
                                >
                                  View {link.label}
                                </Link>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
