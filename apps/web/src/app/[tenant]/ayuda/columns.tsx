"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTenantHref } from "@/lib/use-tenant-href";

export interface AyudaProgramListItem {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  beneficiaryCount: number;
  verifiedCount: number;
  notReceivedCount: number;
  createdAt: Date;
}

function TitleCell({ row }: { row: Row<AyudaProgramListItem> }) {
  const tenantHref = useTenantHref();
  const item = row.original;
  return (
    <Link
      href={tenantHref(`/ayuda/${item.id}`)}
      className="font-medium text-primary hover:underline"
    >
      {item.title}
    </Link>
  );
}

export const columns: ColumnDef<AyudaProgramListItem>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => <TitleCell row={row} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "beneficiaryCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Beneficiaries" />
    ),
    cell: ({ row }) =>
      row.getValue<number>("beneficiaryCount").toLocaleString(),
  },
  {
    accessorKey: "verifiedCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Verified" />
    ),
    cell: ({ row }) =>
      row.getValue<number>("verifiedCount").toLocaleString(),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue<string>("createdAt"));
      return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  },
];
