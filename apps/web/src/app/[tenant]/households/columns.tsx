"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";

export interface HouseholdListItem {
  id: string;
  householdNumber: string;
  barangay: string;
  memberCount: number;
  head: {
    id: string;
    fullName: string;
    categoryIds: string[];
  };
}

function HouseholdNumberCell({ row }: { row: Row<HouseholdListItem> }) {
  const params = useParams<{ tenant: string }>();
  const item = row.original;
  return (
    <Link
      href={`/${params.tenant}/households/${item.id}`}
      className="font-medium text-primary hover:underline"
    >
      {item.householdNumber}
    </Link>
  );
}

function HeadCategoryCell({ row }: { row: Row<HouseholdListItem> }) {
  const categoryIds = row.original.head.categoryIds;
  const query = trpc.category.list.useQuery({ status: "ACTIVE" });

  const names = useMemo(() => {
    const byId = new Map((query.data ?? []).map((c) => [c.id, c.name]));
    return categoryIds.map((id) => byId.get(id) ?? id);
  }, [query.data, categoryIds]);

  if (names.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {names.map((name, index) => (
        <Badge key={`${categoryIds[index]}-${name}`} variant="secondary">
          {name}
        </Badge>
      ))}
    </div>
  );
}

export const columns: ColumnDef<HouseholdListItem>[] = [
  {
    accessorKey: "householdNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Household No." />
    ),
    cell: ({ row }) => <HouseholdNumberCell row={row} />,
  },
  {
    id: "head",
    accessorFn: (row) => row.head.fullName,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Head" />
    ),
    cell: ({ row }) => row.original.head.fullName,
  },
  {
    accessorKey: "memberCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Members" />
    ),
  },
  {
    accessorKey: "barangay",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Barangay" />
    ),
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => <HeadCategoryCell row={row} />,
  },
];
