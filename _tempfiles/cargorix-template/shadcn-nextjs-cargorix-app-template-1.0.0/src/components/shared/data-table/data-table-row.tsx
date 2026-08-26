'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { flexRender, type Row } from '@tanstack/react-table'

// Component Imports
import { TableCell, TableRow } from '@/components/ui/table'

// Util Imports
import { cn } from '@/lib/utils'

const DEFAULT_INTERACTIVE_COLUMN_IDS = ['actions']

type DataTableRowProps<TData> = {
  row: Row<TData>
  href?: string
  label?: string
  interactiveColumnIds?: string[]
}

const DataTableRow = <TData,>({
  row,
  href,
  label,
  interactiveColumnIds = DEFAULT_INTERACTIVE_COLUMN_IDS
}: DataTableRowProps<TData>) => {
  // Hooks
  const router = useRouter()

  return (
    <TableRow
      role={href ? 'link' : undefined}
      tabIndex={href ? 0 : undefined}
      aria-label={href ? label : undefined}
      data-state={row.getIsSelected() ? 'selected' : undefined}
      onClick={href ? () => router.push(href) : undefined}
      onKeyDown={
        href
          ? e => {
              if (e.key === 'Enter') router.push(href)
            }
          : undefined
      }
      className={
        href ? 'focus-visible:ring-ring/50 cursor-pointer focus-visible:ring-2 focus-visible:outline-none' : undefined
      }
    >
      {row.getVisibleCells().map(cell => (
        <TableCell
          key={cell.id}
          onClick={interactiveColumnIds.includes(cell.column.id) ? e => e.stopPropagation() : undefined}
          className={cn('px-4 py-3.5', cell.column.columnDef.meta?.cellClassName)}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export default DataTableRow
