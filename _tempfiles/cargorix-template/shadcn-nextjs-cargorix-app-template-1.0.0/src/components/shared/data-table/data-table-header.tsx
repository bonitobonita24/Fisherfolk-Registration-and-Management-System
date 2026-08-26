'use client'

// Third-party Imports
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table'

// Component Imports
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { cn } from '@/lib/utils'

type DataTableHeaderProps<TData> = {
  table: TanstackTable<TData>
}

const DataTableHeader = <TData,>({ table }: DataTableHeaderProps<TData>) => (
  <TableHeader>
    {table.getHeaderGroups().map(headerGroup => (
      <TableRow key={headerGroup.id} className='hover:bg-transparent'>
        {headerGroup.headers.map(header => {
          const canSort = header.column.getCanSort()
          const sorted = header.column.getIsSorted()

          return (
            <TableHead
              key={header.id}
              aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
              tabIndex={canSort ? 0 : undefined}
              onClick={canSort ? () => header.column.toggleSorting(sorted === 'asc') : undefined}
              onKeyDown={
                canSort
                  ? e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        header.column.toggleSorting(sorted === 'asc')
                      }
                    }
                  : undefined
              }
              className={cn(
                'h-12 px-4',
                canSort &&
                  'group/sort hover:text-foreground focus-visible:ring-ring/50 cursor-pointer select-none focus-visible:ring-2 focus-visible:outline-none',
                header.column.columnDef.meta?.cellClassName
              )}
            >
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          )
        })}
      </TableRow>
    ))}
  </TableHeader>
)

export default DataTableHeader
