"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import Link from "next/link";
import { GEAR_TYPE_LABELS, CATCH_DISPOSITION_LABELS } from "@frms/shared/constants";
import type { GearType, CatchDisposition } from "@frms/shared/types";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { useTenantHref } from "@/lib/use-tenant-href";

export interface FishCatchListItem {
  id: string;
  referenceNo: string;
  landingDate: string | Date;
  gearType: GearType;
  totalCatchKg: number;
  disposition: CatchDisposition | null;
  fishingGroundBarangay: string | null;
  fishingGroundLabel: string | null;
  numTrips: number;
  fisherfolk: {
    id: string;
    firstName: string;
    lastName: string;
    idNumber: string;
  };
  vessel: {
    id: string;
    mfvrNumber: string;
    vesselName: string | null;
  } | null;
  _count: {
    species: number;
  };
}

function ReferenceNoCell({ row }: { row: Row<FishCatchListItem> }) {
  const tenantHref = useTenantHref();
  const item = row.original;
  return (
    <Link
      href={tenantHref(`/fish-catches/${item.id}`)}
      className="font-medium text-primary hover:underline"
    >
      {item.referenceNo}
    </Link>
  );
}

function FisherfolkCell({ row }: { row: Row<FishCatchListItem> }) {
  const { fisherfolk } = row.original;
  return (
    <div className="flex flex-col">
      <span className="font-medium text-foreground">
        {fisherfolk.firstName} {fisherfolk.lastName}
      </span>
      <span className="font-mono text-xs text-muted-foreground">
        {fisherfolk.idNumber}
      </span>
    </div>
  );
}

export const columns: ColumnDef<FishCatchListItem>[] = [
  {
    accessorKey: "referenceNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reference No" />
    ),
    cell: ({ row }) => <ReferenceNoCell row={row} />,
  },
  {
    id: "fisherfolk",
    accessorFn: (row) => `${row.fisherfolk.firstName} ${row.fisherfolk.lastName}`,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fisherfolk" />
    ),
    cell: ({ row }) => <FisherfolkCell row={row} />,
  },
  {
    accessorKey: "landingDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Landing Date" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue<string | Date>("landingDate"));
      return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  },
  {
    accessorKey: "gearType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Gear" />
    ),
    cell: ({ row }) => {
      const gearType = row.getValue<GearType>("gearType");
      return GEAR_TYPE_LABELS[gearType] ?? gearType;
    },
  },
  {
    id: "speciesCount",
    accessorFn: (row) => row._count.species,
    header: "Species",
    cell: ({ row }) => row.original._count.species,
  },
  {
    accessorKey: "totalCatchKg",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Catch (kg)" />
    ),
    cell: ({ row }) => {
      const kg = row.getValue<number>("totalCatchKg");
      return `${kg.toLocaleString()} kg`;
    },
  },
  {
    id: "fishingGround",
    header: "Fishing Ground",
    cell: ({ row }) => {
      const { fishingGroundBarangay, fishingGroundLabel } = row.original;
      return fishingGroundBarangay ?? fishingGroundLabel ?? "—";
    },
  },
  {
    accessorKey: "disposition",
    header: "Disposition",
    cell: ({ row }) => {
      const disposition = row.getValue<CatchDisposition | null>("disposition");
      return disposition ? CATCH_DISPOSITION_LABELS[disposition] : "—";
    },
  },
];
