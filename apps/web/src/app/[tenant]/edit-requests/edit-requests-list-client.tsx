"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";

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

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
type EditRequestStatus = (typeof STATUSES)[number];

const PAGE_SIZES = [10, 20, 50] as const;

export function EditRequestsListClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);
  const [status, setStatus] = useState<EditRequestStatus>("PENDING");

  const { data } = trpc.editRequest.list.useQuery(
    { page, limit, status },
    { placeholderData: keepPreviousData },
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const handleStatusChange = (value: string) => {
    setStatus(value as EditRequestStatus);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setLimit(size);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <ListToolbar>
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">All Edit Requests</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {data ? data.total : "-"}
          </span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 w-full sm:w-[150px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="w-52">
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
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
            icon={ClipboardList}
            title="No edit requests"
            description="Change requests will appear here for review."
          />
        }
      />

      <ListPagination
        page={page}
        pageSize={limit}
        pageSizeOptions={PAGE_SIZES}
        pageCount={totalPages}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        summary={
          data
            ? `${data.total} record${data.total !== 1 ? "s" : ""} found`
            : "Loading..."
        }
      />
    </div>
  );
}
