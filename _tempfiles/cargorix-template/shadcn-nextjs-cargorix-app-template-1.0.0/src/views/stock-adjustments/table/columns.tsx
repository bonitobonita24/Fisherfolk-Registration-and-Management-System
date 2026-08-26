'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

// Type Imports
import type { StockAdjustment } from '@/types/entities/stock-adjustment'

// Component Imports
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'
import AdjustmentRowActions from './adjustment-row-actions'

// Util Imports
import { computeAdjustmentTotals } from '@/lib/selectors/stock-adjustments-selectors'
import { cn } from '@/lib/utils'

// Data Imports
import { ADJUSTMENT_REASON_BADGE, ADJUSTMENT_STATUS_BADGE } from '../adjustment-badges'

const getStockAdjustmentColumns = (): ColumnDef<StockAdjustment>[] => [
  {
    id: 'number',
    accessorKey: 'number',
    meta: { filterVariant: 'text', label: 'Adjustment ID' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Adjustment ID' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const a = row.original
      const firstLine = a.lines[0]

      return (
        a.number.toLowerCase().includes(search) ||
        Boolean(firstLine?.name.toLowerCase().includes(search)) ||
        Boolean(firstLine?.sku.toLowerCase().includes(search))
      )
    },
    cell: ({ row }) => <span className='text-foreground font-semibold'>{row.original.number}</span>
  },
  {
    id: 'warehouse',
    accessorKey: 'warehouseName',
    meta: { label: 'Warehouse' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Warehouse' />,
    filterFn: (row, _id, value) => value === 'all' || row.original.warehouseId === value
  },
  {
    id: 'reason',
    accessorKey: 'reason',
    meta: { filterVariant: 'select', label: 'Reason' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Reason' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    cell: ({ row }) => {
      const reason = ADJUSTMENT_REASON_BADGE[row.original.reason]

      return <Badge className={reason.className}>{reason.label}</Badge>
    }
  },
  {
    id: 'lines',
    accessorFn: row => row.lines[0]?.name ?? '',
    enableSorting: false,
    meta: { label: 'Line items' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Line items' />,
    cell: ({ row }) => {
      const firstLine = row.original.lines[0]
      const extraCount = row.original.lines.length - 1

      if (!firstLine) return <span className='text-muted-foreground'>—</span>

      return (
        <div className='flex items-center gap-2'>
          <div className='flex flex-col'>
            <span className='font-medium'>{firstLine.name}</span>
            <span className='text-muted-foreground text-xs'>{firstLine.sku}</span>
          </div>
          {extraCount > 0 && <Badge variant='secondary'>+{extraCount} more</Badge>}
        </div>
      )
    }
  },
  {
    id: 'netChange',
    accessorFn: row => computeAdjustmentTotals(row).netChange,
    meta: { label: 'Net change' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Net change' />,
    cell: ({ row }) => {
      const net = computeAdjustmentTotals(row.original).netChange

      return (
        <span className={cn('tabular-nums', net > 0 && 'text-success', net < 0 && 'text-destructive')}>
          {net > 0 ? `+${net}` : net}
        </span>
      )
    }
  },
  {
    id: 'requestedBy',
    accessorKey: 'requestedBy',
    meta: { label: 'Requested By' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Requested By' />
  },
  {
    id: 'createdDate',
    accessorKey: 'createdAt',
    meta: { label: 'Created Date' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Created Date' />,
    cell: ({ row }) => <span>{format(new Date(row.original.createdAt), 'MMM d, yyyy')}</span>
  },
  {
    id: 'status',
    accessorKey: 'status',
    meta: { filterVariant: 'select', label: 'Status' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    cell: ({ row }) => {
      const status = ADJUSTMENT_STATUS_BADGE[row.original.status]

      return <Badge className={status.className}>{status.label}</Badge>
    }
  },
  {
    id: 'actions',
    size: 60,
    enableHiding: false,
    enableSorting: false,
    meta: { label: 'Actions' },
    header: () => <span className='text-muted-foreground text-sm font-medium'>Actions</span>,
    cell: ({ row }) => <AdjustmentRowActions adjustment={row.original} />
  }
]

export default getStockAdjustmentColumns
