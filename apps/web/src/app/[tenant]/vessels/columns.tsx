"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTenantHref } from "@/lib/use-tenant-href";

export interface VesselListItem {
  id: string;
  mfvrNumber: string;
  vesselName: string | null;
  vesselType: string;
  status: string;
  createdAt: Date;
}

function MfvrNumberCell({ row }: { row: Row<VesselListItem> }) {
  const tenantHref = useTenantHref();
  const item = row.original;
  return (
    <Link
      href={tenantHref(`/vessels/${item.id}`)}
      className="font-medium text-primary hover:underline"
    >
      {item.mfvrNumber}
    </Link>
  );
}

export const columns: ColumnDef<VesselListItem>[] = [
  {
    accessorKey: "mfvrNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="MFVR Number" />
    ),
    cell: ({ row }) => <MfvrNumberCell row={row} />,
  },
  {
    accessorKey: "vesselName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vessel Name" />
    ),
    cell: ({ row }) => row.getValue<string | null>("vesselName") ?? "—",
  },
  {
    accessorKey: "vesselType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vessel Type" />
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
