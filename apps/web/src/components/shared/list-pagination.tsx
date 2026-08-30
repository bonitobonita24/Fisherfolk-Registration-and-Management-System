import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ListPaginationProps {
  /** Current 1-indexed page. */
  page: number;
  /** Rows-per-page value — must be one of `pageSizeOptions`. */
  pageSize: number;
  /** Selectable rows-per-page values (e.g. [10, 20, 50]). */
  pageSizeOptions: readonly number[];
  /** Total page count (0 or negative treated as "1 of 1"). */
  pageCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** Left-aligned summary text — e.g. "42 records found" or "Loading...". Caller composes the label so entity wording (records/vessels/items) stays flexible per list. */
  summary?: ReactNode;
  className?: string;
}

/**
 * Floating-card footer that encapsulates the standard list-view pagination controls
 * (rows-per-page select + prev/next/first/last + page count + summary text).
 * Same Cargorix floating-card tokens as ListToolbar. Chrome + control wiring only —
 * page/pageSize state and data-fetching stay owned by the caller.
 */
export function ListPagination({
  page,
  pageSize,
  pageSizeOptions,
  pageCount,
  onPageChange,
  onPageSizeChange,
  summary,
  className,
}: ListPaginationProps) {
  const displayedPageCount = pageCount > 0 ? pageCount : 1;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm",
        "sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {summary != null ? (
        <p className="text-sm text-muted-foreground">{summary}</p>
      ) : (
        <span />
      )}
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {page} of {displayedPageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(Math.min(displayedPageCount, page + 1))}
            disabled={page >= displayedPageCount}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(displayedPageCount)}
            disabled={page >= displayedPageCount}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
