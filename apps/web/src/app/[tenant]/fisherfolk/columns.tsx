"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

export interface FisherfolkListItem {
  id: string;
  idNumber: string;
  fullName: string;
  barangay: string;
  contactNumber: string | null;
  status: string;
  createdAt: Date;
}

function IdNumberCell({ row }: { row: Row<FisherfolkListItem> }) {
  const params = useParams<{ tenant: string }>();
  const item = row.original;
  return (
    <Link
      href={`/${params.tenant}/fisherfolk/${item.id}`}
      className="font-medium text-primary hover:underline"
    >
      {item.idNumber}
    </Link>
  );
}

export const columns: ColumnDef<FisherfolkListItem>[] = [
  {
    accessorKey: "idNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID Number" />
    ),
    cell: ({ row }) => <IdNumberCell row={row} />,
  },
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Full Name" />
    ),
  },
  {
    accessorKey: "barangay",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Barangay" />
    ),
  },
  {
    accessorKey: "contactNumber",
    header: "Contact",
    cell: ({ row }) => row.getValue<string | null>("contactNumber") ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Registered" />
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
