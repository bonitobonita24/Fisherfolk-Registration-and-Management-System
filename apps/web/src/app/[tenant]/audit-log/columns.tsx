"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { BadgeColor } from "@/components/shared/status-badge";

export interface AuditLogListItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  createdAt: Date;
  user: { id: string; name: string } | null;
}

const ACTION_COLOR: Record<string, BadgeColor> = {
  CREATE: "green",
  UPDATE: "blue",
  DELETE: "red",
  REQUEST: "yellow",
  APPROVE: "green",
  REJECT: "red",
  RENEW: "green",
  PRINT: "gray",
  VIOLATION_FILED: "red",
  VIOLATION_LIFTED: "green",
  LOGIN: "purple",
  EXPORT: "orange",
  MEDIA_DOWNLOAD: "gray",
  EXPIRE: "yellow",
};

function formatTimestamp(value: Date | string): string {
  const date = new Date(value);
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

interface AuditLogColumnsOptions {
  onView: (id: string) => void;
}

export function buildColumns({
  onView,
}: AuditLogColumnsOptions): ColumnDef<AuditLogListItem>[] {
  return [
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Timestamp" />
      ),
      cell: ({ row }) => formatTimestamp(row.getValue<Date>("createdAt")),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.getValue<string>("action");
        return (
          <StatusBadge status={action.replace(/_/g, " ")} color={ACTION_COLOR[action] ?? "gray"} />
        );
      },
    },
    {
      id: "entity",
      header: "Entity",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="text-sm">
            {item.entityType}{" "}
            <span className="text-muted-foreground">#{shortId(item.entityId)}</span>
          </span>
        );
      },
    },
    {
      id: "user",
      header: "User",
      cell: ({ row }) => row.original.user?.name ?? "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: { row: Row<AuditLogListItem> }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(row.original.id)}
        >
          View
        </Button>
      ),
    },
  ];
}
