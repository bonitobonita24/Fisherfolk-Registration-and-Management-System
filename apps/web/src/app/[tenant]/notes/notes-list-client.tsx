"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { NotebookPen } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState, ListToolbar, ListPagination } from "@/components/shared";
import { SearchInput } from "@/components/shared/search-input";
import { columns } from "./columns";

const PAGE_SIZES = [10, 20, 50] as const;

export function NotesListClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);
  const [search, setSearch] = useState("");

  const { data } = trpc.note.list.useQuery(
    {
      page,
      limit,
      search: search || undefined,
    },
    { placeholderData: keepPreviousData },
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <ListToolbar>
        <div className="flex items-center gap-2">
          <NotebookPen className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">Field Diary</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {data ? data.total : "-"}
          </span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search note text…"
            className="w-full sm:w-64"
          />
        </div>
      </ListToolbar>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        pageSize={limit}
        showPagination={false}
        emptyState={
          <EmptyState
            icon={NotebookPen}
            title="No field notes yet"
            description="Notes captured from the field — with a location and time stamp — will show up here."
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
            ? `${data.total} note${data.total !== 1 ? "s" : ""} found`
            : "Loading..."
        }
      />
    </div>
  );
}
