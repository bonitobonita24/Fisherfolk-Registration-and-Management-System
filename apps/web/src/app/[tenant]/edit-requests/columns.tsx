"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

export interface EditRequestListItem {
  id: string;
  fieldChanges: unknown;
  status: string;
  createdAt: Date;
  fisherfolk: {
    id: string;
    fullName: string;
    idNumber: string;
  };
  requestedBy: {
    id: string;
    name: string | null;
  };
  reviewedBy: {
    id: string;
    name: string | null;
  } | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
}

function FisherfolkCell({ row }: { row: Row<EditRequestListItem> }) {
  const params = useParams<{ tenant: string }>();
  const { fisherfolk } = row.original;
  return (
    <Link
      href={`/${params.tenant}/fisherfolk/${fisherfolk.id}`}
      className="font-medium text-primary hover:underline"
    >
      <span className="block">{fisherfolk.fullName}</span>
      <span className="text-xs text-muted-foreground">{fisherfolk.idNumber}</span>
    </Link>
  );
}

function ChangedFieldsCell({ row }: { row: Row<EditRequestListItem> }) {
  const raw = row.original.fieldChanges;
  const fields =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? Object.keys(raw)
      : [];
  if (fields.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <span title={fields.join(", ")}>
      {fields.length === 1
        ? fields[0]
        : `${fields[0]} +${fields.length - 1} more`}
    </span>
  );
}

function ReviewLinkCell({ row }: { row: Row<EditRequestListItem> }) {
  const params = useParams<{ tenant: string }>();
  return (
    <Link
      href={`/${params.tenant}/edit-requests/${row.original.id}`}
      className="font-medium text-primary hover:underline"
    >
      Review
    </Link>
  );
}

export const columns: ColumnDef<EditRequestListItem>[] = [
  {
    accessorKey: "fisherfolk",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fisherfolk" />
    ),
    cell: ({ row }) => <FisherfolkCell row={row} />,
  },
  {
    accessorKey: "fieldChanges",
    header: "Changed Fields",
    cell: ({ row }) => <ChangedFieldsCell row={row} />,
  },
  {
    id: "requestedBy",
    accessorFn: (row) => row.requestedBy.name ?? "—",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Requested By" />
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Submitted" />
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
  {
    id: "review",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <ReviewLinkCell row={row} />,
  },
];
