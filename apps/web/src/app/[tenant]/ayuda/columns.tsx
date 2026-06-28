"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

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

export const columns: ColumnDef<AyudaProgramListItem>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue<string>("title")}</span>
    ),
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
