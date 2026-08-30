"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { HandHeart } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState, ListToolbar, ListPagination } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { columns } from "./columns";

const STATUSES = ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
type ProgramStatus = (typeof STATUSES)[number];

const PAGE_SIZES = [10, 20, 50] as const;

export function AyudaListClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);
  const [status, setStatus] = useState<ProgramStatus | undefined>(undefined);

  const { data } = trpc.ayuda.listPrograms.useQuery(
    {
      page,
      limit,
      status,
    },
    { placeholderData: keepPreviousData },
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const handleStatusChange = (value: string) => {
    setStatus(value === "ALL" ? undefined : (value as ProgramStatus));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <ListToolbar>
        <div className="flex items-center gap-2">
          <HandHeart className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">All Programs</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {data ? data.total : "-"}
          </span>
        </div>
        <Select value={status ?? "ALL"} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-8 w-full sm:w-[180px]" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="w-52">
            <SelectItem value="ALL">All Status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ListToolbar>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        pageSize={limit}
        showPagination={false}
        emptyState={
          <EmptyState
            icon={HandHeart}
            title="No ayuda programs found"
            description="Try adjusting your search or filters."
          />
        }
      />

      <ListPagination
        page={page}
        pageSize={limit}
        pageSizeOptions={PAGE_SIZES}
        pageCount={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setLimit(size);
          setPage(1);
        }}
        summary={
          data
            ? `${data.total} record${data.total !== 1 ? "s" : ""} found`
            : "Loading..."
        }
      />
    </div>
  );
}
