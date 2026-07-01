"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Clock3, RefreshCw, Sparkles } from "lucide-react";
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
  idReleasedAt: string | null;
  renewalCount: number;
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
    id: "registrationType",
    header: "Registration",
    cell: ({ row }) => {
      const isNew = row.original.renewalCount === 0;
      return (
        <StatusBadge
          status={isNew ? "New" : "Renewed"}
          color={isNew ? "green" : "orange"}
          icon={isNew ? Sparkles : RefreshCw}
        />
      );
    },
  },
  {
    id: "idRelease",
    header: "ID Release",
    cell: ({ row }) => {
      const releasedAt = row.original.idReleasedAt;
      if (!releasedAt) {
        return (
          <StatusBadge status="Not Released" color="gray" icon={Clock3} />
        );
      }
      const dateStr = new Date(releasedAt).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      return (
        <span title={`Released: ${dateStr}`}>
          <StatusBadge status="Released" color="green" icon={CheckCircle2} />
        </span>
      );
    },
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
