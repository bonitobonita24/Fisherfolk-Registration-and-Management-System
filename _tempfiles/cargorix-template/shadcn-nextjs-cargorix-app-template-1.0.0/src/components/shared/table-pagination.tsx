'use client'

// Third-party Imports
import type { Table } from '@tanstack/react-table'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

// Hook Imports
import { usePagination } from '@/hooks/use-pagination'

type TablePaginationProps<TData> = {
  table: Table<TData>
  noun: string
}

const TablePagination = <TData,>({ table, noun }: TablePaginationProps<TData>) => {
  // Vars
  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const currentPage = pageIndex + 1
  const totalPages = table.getPageCount()
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize)

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages,
    paginationItemsToDisplay: 5
  })

  return (
    <div className='flex items-center justify-between gap-3 border-t px-4 py-3 max-sm:flex-col'>
      <p className='text-muted-foreground text-sm'>
        Showing {firstRow} to {lastRow} of {totalRows} {noun}
      </p>

      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          size='icon'
          aria-label='Previous page'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeftIcon className='size-4' />
        </Button>

        {showLeftEllipsis && (
          <>
            <Button variant='ghost' size='icon' onClick={() => table.setPageIndex(0)}>
              1
            </Button>
            <span className='text-muted-foreground px-1 text-sm'>…</span>
          </>
        )}

        {pages.map(page => (
          <Button
            key={page}
            variant={currentPage === page ? 'outline' : 'ghost'}
            size='icon'
            aria-current={currentPage === page ? 'page' : undefined}
            onClick={() => table.setPageIndex(page - 1)}
          >
            {page}
          </Button>
        ))}

        {showRightEllipsis && (
          <>
            <span className='text-muted-foreground px-1 text-sm'>…</span>
            <Button variant='ghost' size='icon' onClick={() => table.setPageIndex(totalPages - 1)}>
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant='outline'
          size='icon'
          aria-label='Next page'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRightIcon className='size-4' />
        </Button>
      </div>
    </div>
  )
}

export default TablePagination
