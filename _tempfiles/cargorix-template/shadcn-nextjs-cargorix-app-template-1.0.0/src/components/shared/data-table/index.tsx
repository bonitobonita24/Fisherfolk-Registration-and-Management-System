'use client'

// Third-party Imports
import type { Table as TanstackTable } from '@tanstack/react-table'

// Component Imports
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import DataTableHeader from './data-table-header'
import DataTableRow from './data-table-row'

type DataTableProps<TData> = {
  table: TanstackTable<TData>
  columnCount: number
  emptyMessage: string
  rowHref?: (row: TData) => string
  rowLabel?: (row: TData) => string
  interactiveColumnIds?: string[]
  scrollable?: boolean
}

const DataTable = <TData,>({
  table,
  columnCount,
  emptyMessage,
  rowHref,
  rowLabel,
  interactiveColumnIds,
  scrollable
}: DataTableProps<TData>) => {
  // Vars
  const rows = table.getRowModel().rows

  const content = (
    <Table>
      <DataTableHeader table={table} />
      <TableBody>
        {rows.length ? (
          rows.map(row => (
            <DataTableRow
              key={row.id}
              row={row}
              href={rowHref?.(row.original)}
              label={rowLabel?.(row.original)}
              interactiveColumnIds={interactiveColumnIds}
            />
          ))
        ) : (
          <TableRow className='hover:bg-transparent'>
            <TableCell colSpan={columnCount} className='text-muted-foreground h-24 text-center'>
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  return scrollable ? <div className='overflow-x-auto'>{content}</div> : content
}

export default DataTable
