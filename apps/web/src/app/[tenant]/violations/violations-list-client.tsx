"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState, ListToolbar, ListPagination, SearchInput } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { columns } from "./columns";

const STATUSES = ["ACTIVE", "LIFTED", "ARCHIVED"] as const;
const PAGE_SIZES = [10, 20, 50] as const;

type ViolationStatus = (typeof STATUSES)[number];

export function ViolationsListClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ViolationStatus | undefined>(undefined);

  const { data } = trpc.violation.list.useQuery(
    {
      page,
      limit,
      search: search || undefined,
      status,
    },
    { placeholderData: keepPreviousData },
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value === "ALL" ? undefined : (value as ViolationStatus));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <ListToolbar>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">All Violations</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {data ? data.total : "-"}
          </span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search violations..."
            className="w-full sm:w-56"
          />
          <Select value={status ?? "ALL"} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 w-full sm:w-[150px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="w-52">
              <SelectItem value="ALL">All Status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ListToolbar>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        pageSize={limit}
        showPagination={false}
        emptyState={
          <EmptyState
            icon={AlertTriangle}
            title="No violations found"
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
