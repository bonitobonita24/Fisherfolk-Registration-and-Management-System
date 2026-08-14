"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState, SearchInput } from "@/components/shared";
import { Button } from "@/components/ui/button";
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

  const handlePageSizeChange = (value: string) => {
    setLimit(Number(value));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-30 -mx-4 bg-background">
        <div className="flex min-h-11 flex-wrap items-center gap-2 border-b px-4 py-1.5">
          <AlertTriangle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">All Violations</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {data ? data.total : "-"}
          </span>
          <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
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
        </div>
      </div>

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

      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-muted-foreground">
          {data
            ? `${data.total} record${data.total !== 1 ? "s" : ""} found`
            : "Loading..."}
        </p>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={String(limit)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px]" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {page} of {totalPages > 0 ? totalPages : 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setPage(1)}
              disabled={page <= 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
