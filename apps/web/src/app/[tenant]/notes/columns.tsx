"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import Link from "next/link";
import { Paperclip } from "lucide-react";

import { DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared";
import { useTenantHref } from "@/lib/use-tenant-href";

export interface NoteListItem {
  id: string;
  title: string | null;
  bodyText: string;
  capturedAt: string | Date;
  locationLabel: string;
  visibility: "private" | "shared";
  createdAt: string | Date;
  author: { id: string; name: string | null } | null;
  _count: { media: number; entityRefs: number };
}

function firstLine(text: string): string {
  const line = text.split("\n").find((l) => l.trim().length > 0) ?? text;
  return line.length > 80 ? `${line.slice(0, 80)}…` : line;
}

function TitleCell({ row }: { row: Row<NoteListItem> }) {
  const tenantHref = useTenantHref();
  const item = row.original;
  const label = item.title?.trim() || firstLine(item.bodyText) || "Untitled note";
  return (
    <Link
      href={tenantHref(`/notes/${item.id}`)}
      className="font-medium text-primary hover:underline"
    >
      {label}
    </Link>
  );
}

export const columns: ColumnDef<NoteListItem>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Note" />,
    cell: ({ row }) => <TitleCell row={row} />,
  },
  {
    accessorKey: "capturedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Captured" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue<string | Date>("capturedAt"));
      return date.toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  {
    accessorKey: "locationLabel",
    header: "Location",
    cell: ({ row }) => row.getValue<string>("locationLabel") || "—",
  },
  {
    id: "author",
    accessorFn: (row) => row.author?.name ?? "",
    header: "Author",
    cell: ({ row }) => row.original.author?.name ?? "—",
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => {
      const v = row.getValue<NoteListItem["visibility"]>("visibility");
      return (
        <StatusBadge
          status={v === "shared" ? "Shared" : "Private"}
          color={v === "shared" ? "blue" : "gray"}
        />
      );
    },
  },
  {
    id: "attachments",
    accessorFn: (row) => row._count.media,
    header: "Media",
    cell: ({ row }) =>
      row.original._count.media > 0 ? (
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Paperclip className="size-3.5" aria-hidden="true" />
          {row.original._count.media}
        </span>
      ) : (
        "—"
      ),
  },
];
