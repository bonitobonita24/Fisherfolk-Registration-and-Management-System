"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

export interface ViolationListItem {
  id: string;
  subject: string;
  targetType: "FISHERFOLK" | "VESSEL" | "BOTH";
  status: "ACTIVE" | "LIFTED" | "ARCHIVED";
  createdAt: Date;
  fisherfolk: { id: string; fullName: string } | null;
  vessel: { id: string; mfvrNumber: string; vesselName: string | null } | null;
  filedBy: { id: string; name: string };
}

function formatTarget(item: ViolationListItem): string {
  if (item.targetType === "FISHERFOLK") {
    return item.fisherfolk?.fullName ?? "—";
  }
  if (item.targetType === "VESSEL") {
    const v = item.vessel;
    if (!v) return "—";
    return v.vesselName ? `${v.vesselName} (${v.mfvrNumber})` : v.mfvrNumber;
  }
  // BOTH
  const parts: string[] = [];
  if (item.fisherfolk) parts.push(item.fisherfolk.fullName);
  if (item.vessel) {
    parts.push(
      item.vessel.vesselName
        ? `${item.vessel.vesselName} (${item.vessel.mfvrNumber})`
        : item.vessel.mfvrNumber,
    );
  }
  return parts.join(", ") || "—";
}

function SubjectCell({ row }: { row: Row<ViolationListItem> }) {
  const params = useParams<{ tenant: string }>();
  const item = row.original;
  return (
    <Link
      href={`/${params.tenant}/violations/${item.id}`}
      className="font-medium text-primary hover:underline"
    >
      {item.subject}
    </Link>
  );
}

export const columns: ColumnDef<ViolationListItem>[] = [
  {
    accessorKey: "subject",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
    cell: ({ row }) => <SubjectCell row={row} />,
  },
  {
    id: "target",
    header: "Target",
    cell: ({ row }) => formatTarget(row.original),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<string>("status");
      return (
        <StatusBadge
          status={status}
          color={status === "ACTIVE" ? "red" : "green"}
        />
      );
    },
  },
  {
    id: "filedBy",
    header: "Filed By",
    cell: ({ row }) => row.original.filedBy.name,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Filed" />
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
