"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import { Plus, ImageOff, CalendarClock, X, Users } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState, ListToolbar, ListPagination } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { columns, type FisherfolkListItem } from "./columns";

const STATUSES = ["NEW", "RENEWED", "EXPIRED", "ARCHIVED"] as const;
const PAGE_SIZES = [10, 20, 50] as const;

export function FisherfolkListClient() {
  const tenantHref = useTenantHref();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const missingParam = searchParams.get("missing");
  const missing: "photo" | "signature" | undefined =
    missingParam === "photo" || missingParam === "signature" ? missingParam : undefined;
  const dueForRenewal = searchParams.get("dueForRenewal") === "true";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);

  // Reset to page 1 when the missing/dueForRenewal filter changes via URL
  useEffect(() => {
    setPage(1);
  }, [missing, dueForRenewal]);

  const { data } = trpc.fisherfolk.list.useQuery(
    {
      page,
      limit,
      search: search || undefined,
      status: status as (typeof STATUSES)[number] | undefined,
      ...(missing !== undefined ? { missing } : {}),
      ...(dueForRenewal ? { dueForRenewal: true } : {}),
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

  return (
    <div className="space-y-4">
      <ListToolbar>
        <div className="flex items-center gap-2">
          <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">All Fisherfolk</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {data ? data.total : "-"}
          </span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
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
      </ListToolbar>

      {missing !== undefined && (
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
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

      {dueForRenewal && (
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            Showing only records{" "}
            <span className="font-medium text-foreground">due for renewal</span> (3-year cycle) — reminder only, no status is changed automatically.
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
