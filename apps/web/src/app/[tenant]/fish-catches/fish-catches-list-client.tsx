"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import { Fish } from "lucide-react";

import { GEAR_TYPE_LABELS } from "@frms/shared/constants";
import { CALAPAN_BARANGAYS } from "@frms/shared/constants";
import type { GearType } from "@frms/shared/types";

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState, ListToolbar, ListPagination } from "@/components/shared";
import { SearchInput } from "@/components/shared/search-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { columns } from "./columns";

const GEAR_TYPES = Object.keys(GEAR_TYPE_LABELS) as GearType[];
const PAGE_SIZES = [10, 20, 50] as const;

export function FishCatchesListClient() {
  useParams<{ tenant: string }>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);
  const [search, setSearch] = useState("");
  const [gearType, setGearType] = useState<GearType | undefined>(undefined);
  const [barangay, setBarangay] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data } = trpc.fishCatch.list.useQuery(
    {
      page,
      limit,
      search: search || undefined,
      gearType,
      barangay,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    { placeholderData: keepPreviousData },
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleGearTypeChange = (value: string) => {
    setGearType(value === "ALL" ? undefined : (value as GearType));
    setPage(1);
  };

  const handleBarangayChange = (value: string) => {
    setBarangay(value === "ALL" ? undefined : value);
    setPage(1);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setPage(1);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <ListToolbar>
        <div className="flex items-center gap-2">
          <Fish className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">All Fish Catches</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {data ? data.total : "-"}
          </span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search reference no. or fisherfolk..."
            className="w-full sm:w-56"
          />
          <Select value={gearType ?? "ALL"} onValueChange={handleGearTypeChange}>
            <SelectTrigger className="h-8 w-full sm:w-[180px]" aria-label="Filter by gear type">
              <SelectValue placeholder="Gear Type" />
            </SelectTrigger>
            <SelectContent className="w-60">
              <SelectItem value="ALL">All Gear Types</SelectItem>
              {GEAR_TYPES.map((g) => (
                <SelectItem key={g} value={g}>
                  {GEAR_TYPE_LABELS[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={barangay ?? "ALL"} onValueChange={handleBarangayChange}>
            <SelectTrigger className="h-8 w-full sm:w-[160px]" aria-label="Filter by fishing ground barangay">
              <SelectValue placeholder="Barangay" />
            </SelectTrigger>
            <SelectContent className="w-56">
              <SelectItem value="ALL">All Barangays</SelectItem>
              {CALAPAN_BARANGAYS.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <label htmlFor="fish-catch-date-from" className="text-sm text-muted-foreground">
              From
            </label>
            <Input
              id="fish-catch-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="h-8 w-full sm:w-[150px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="fish-catch-date-to" className="text-sm text-muted-foreground">
              To
            </label>
            <Input
              id="fish-catch-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="h-8 w-full sm:w-[150px]"
            />
          </div>
        </div>
      </ListToolbar>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        pageSize={limit}
        showPagination={false}
        emptyState={
          <EmptyState
            icon={Fish}
            title="No fish catch records found"
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
