"use client";

import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileEdit,
  LogIn,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  id: string;
}

interface ActionMeta {
  label: string;
  Icon: LucideIcon;
}

const ACTION_META: Record<string, ActionMeta> = {
  CREATE:          { label: "Registration created",   Icon: UserPlus       },
  UPDATE:          { label: "Profile updated",         Icon: Pencil         },
  DELETE:          { label: "Record deleted",          Icon: Trash2         },
  REQUEST:         { label: "Edit requested",          Icon: FileEdit       },
  APPROVE:         { label: "Request approved",        Icon: CheckCircle    },
  REJECT:          { label: "Request rejected",        Icon: XCircle        },
  RENEW:           { label: "Registration renewed",    Icon: RefreshCw      },
  VIOLATION_FILED: { label: "Violation filed",         Icon: AlertTriangle  },
  VIOLATION_LIFTED:{ label: "Violation lifted",        Icon: ShieldCheck    },
  LOGIN:           { label: "Logged in",               Icon: LogIn          },
  EXPORT:          { label: "Data exported",           Icon: Download       },
};

function fallbackMeta(action: string): ActionMeta {
  return { label: action.replace(/_/g, " ").toLowerCase(), Icon: Pencil };
}

function formatAbsolute(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7)  return `${diffDay}d ago`;
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function toIso(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString();
}

function TimelineSkeleton() {
  return (
    <div role="status">
      {/* visually-hidden loading announcement for screen readers */}
      <span className="sr-only">Loading activity…</span>
      <ol aria-hidden="true" className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex gap-3">
            <div className="mt-0.5 size-6 shrink-0 rounded-full bg-muted animate-pulse motion-reduce:animate-none" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 w-3/4 rounded bg-muted animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-1/2 rounded bg-muted animate-pulse motion-reduce:animate-none" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function FisherfolkActivityTimeline({ id }: Props) {
  const { data, isLoading, isError } = trpc.fisherfolk.getActivity.useQuery(
    { id },
    { staleTime: 60_000 },
  );

  return (
    <Card className="gap-0 py-5">
      <CardHeader className="px-6 pb-4 pt-0">
        <CardTitle className="text-sm font-medium">Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-0">
        {isLoading ? (
          <TimelineSkeleton />
        ) : isError ? (
          <p className="text-sm text-destructive">
            Failed to load activity.
          </p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ol
            aria-label="Fisherfolk activity history"
            className="relative space-y-0 border-l border-border pl-5"
          >
            {data.map((entry) => {
              const { label, Icon } = ACTION_META[entry.action] ?? fallbackMeta(entry.action);
              const isoDate = toIso(entry.createdAt);
              const absoluteDate = formatAbsolute(entry.createdAt);
              const relativeDate = formatRelative(entry.createdAt);

              return (
                <li
                  key={entry.id}
                  className="relative pb-6 last:pb-0"
                >
                  {/* Dot on the timeline line */}
                  <span
                    className="absolute -left-[1.4rem] top-0 flex size-6 items-center justify-center rounded-full border border-border bg-muted"
                    aria-hidden="true"
                  >
                    <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  </span>

                  <div className="space-y-1 pl-1.5">
                    {/* WHAT — human-readable label (primary signal, not color-only) */}
                    <p className="text-sm font-medium leading-snug tracking-tight text-foreground">
                      {label}
                    </p>
                    {/* WHO — actor name */}
                    <p className="text-xs text-muted-foreground">
                      {entry.actorName ?? "System"}
                    </p>
                    {/* WHEN — machine-readable dateTime + visible human text */}
                    <time
                      dateTime={isoDate}
                      title={absoluteDate}
                      className="block text-xs text-muted-foreground"
                    >
                      {relativeDate}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
