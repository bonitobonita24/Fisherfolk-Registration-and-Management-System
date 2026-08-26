'use client'

// Third-party Imports
import type { Table as TanstackTable } from '@tanstack/react-table'
import { PinIcon } from 'lucide-react'

// Type Imports
import type { Product } from '@/types/entities/product'

// Component Imports
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

// Shared Imports
import DataTableHeader from '@/components/shared/data-table/data-table-header'
import DataTableRow from '@/components/shared/data-table/data-table-row'

const INTERACTIVE_COLUMN_IDS = ['actions', 'pin']

type DataTableProps = {
  table: TanstackTable<Product>
  columnCount: number
}

const DataTable = ({ table, columnCount }: DataTableProps) => {
  // Vars
  const pinnedTopIds = table.getState().rowPinning.top ?? []
  const filteredRowsById = new Map(table.getFilteredRowModel().rows.map(row => [row.id, row]))

  const topRows = pinnedTopIds
    .map(id => filteredRowsById.get(id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))

  const centerRows = table.getCenterRows()

  const renderRow = (row: (typeof topRows)[number]) => (
    <DataTableRow
      key={row.id}
      row={row}
      href={`/products/${row.original.id}`}
      label={`Open product ${row.original.name}`}
      interactiveColumnIds={INTERACTIVE_COLUMN_IDS}
    />
  )

  return (
    <Table>
      <DataTableHeader table={table} />
      <TableBody>
        {topRows.length > 0 && (
          <>
            <TableRow className='bg-muted/50 hover:bg-muted/50'>
              <TableCell colSpan={columnCount} className='text-muted-foreground px-4 py-2 text-xs font-medium'>
                <span className='flex items-center gap-1.5'>
                  <PinIcon className='size-3.5' />
                  Pinned products ({topRows.length})
                </span>
              </TableCell>
            </TableRow>
            {topRows.map(renderRow)}
          </>
        )}
        {centerRows.length > 0 && (
          <TableRow className='bg-muted/50 hover:bg-muted/50'>
            <TableCell colSpan={columnCount} className='text-muted-foreground px-4 py-2 text-xs font-medium'>
              All products
            </TableCell>
          </TableRow>
        )}
        {centerRows.length ? (
          centerRows.map(renderRow)
        ) : topRows.length === 0 ? (
          <TableRow className='hover:bg-transparent'>
            <TableCell colSpan={columnCount} className='text-muted-foreground h-24 text-center'>
              No products found.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  )
}

export default DataTable
