"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import { Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ImageOff, X, Users } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { columns, type FisherfolkListItem } from "./columns";

const STATUSES = ["NEW", "ACTIVE", "RENEWED", "INACTIVE", "ARCHIVED"] as const;
const PAGE_SIZES = [10, 20, 50] as const;

export function FisherfolkListClient() {
  const tenantHref = useTenantHref();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const missingParam = searchParams.get("missing");
  const missing: "photo" | "signature" | undefined =
    missingParam === "photo" || missingParam === "signature" ? missingParam : undefined;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);

  // Reset to page 1 when the missing filter changes via URL
  useEffect(() => {
    setPage(1);
  }, [missing]);

  const { data } = trpc.fisherfolk.list.useQuery(
    {
      page,
      limit,
      search: search || undefined,
      status: status as (typeof STATUSES)[number] | undefined,
      ...(missing !== undefined ? { missing } : {}),
    },
    { placeholderData: keepPreviousData },
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value === "ALL" ? undefined : value);
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
          <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">All Fisherfolk</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {data ? data.total : "-"}
          </span>
          <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, ID, or contact..."
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
            <Button asChild size="sm">
              <Link href={tenantHref("/fisherfolk/register")}>
                <Plus className="mr-2 size-4" />
                Register
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {missing !== undefined && (
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          <ImageOff className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            Showing only records missing a{" "}
            <span className="font-medium text-foreground">{missing}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={() => router.replace(pathname)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear filter</span>
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={(data?.items ?? []).map((item): FisherfolkListItem => ({
          id: item.id,
          idNumber: item.idNumber,
          fullName: item.fullName,
          barangay: item.barangay,
          contactNumber: item.contactNumber,
          status: item.status,
          createdAt: item.createdAt,
          idReleasedAt: item.idReleasedAt
            ? item.idReleasedAt instanceof Date
              ? item.idReleasedAt.toISOString()
              : item.idReleasedAt
            : null,
          renewalCount: item._count.renewals,
        }))}
        pageSize={limit}
        showPagination={false}
        emptyState={
          <EmptyState
            icon={Users}
            title="No fisherfolk found"
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
