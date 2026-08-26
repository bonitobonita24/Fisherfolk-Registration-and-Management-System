'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

// Type Imports
import type { StockTransfer } from '@/types/entities/stock-transfer'

// Component Imports
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'
import TransferRowActions from './transfer-row-actions'

// Util Imports
import { computeTransferTotals } from '@/lib/selectors/stock-transfers-selectors'

// Data Imports
import { TRANSFER_STATUS_BADGE } from '../transfer-badges'

const getStockTransferColumns = (): ColumnDef<StockTransfer>[] => [
  {
    id: 'number',
    accessorKey: 'number',
    meta: { filterVariant: 'text', label: 'Transfer ID' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Transfer ID' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const t = row.original
      const firstLine = t.lines[0]

      return (
        t.number.toLowerCase().includes(search) ||
        Boolean(firstLine?.name.toLowerCase().includes(search)) ||
        Boolean(firstLine?.sku.toLowerCase().includes(search))
      )
    },
    cell: ({ row }) => <span className='text-foreground font-semibold'>{row.original.number}</span>
  },
  {
    id: 'product',
    accessorFn: row => row.lines[0]?.name ?? '',
    enableSorting: false,
    meta: { label: 'Product / SKU' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Product / SKU' />,
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
    id: 'from',
    accessorKey: 'sourceWarehouseName',
    meta: { label: 'From' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='From' />
  },
  {
    id: 'to',
    accessorKey: 'destinationWarehouseName',
    meta: { label: 'To' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='To' />
  },
  {
    id: 'quantity',
    accessorFn: row => computeTransferTotals(row).totalUnitsSent,
    meta: { label: 'Quantity' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Quantity' />,
    cell: ({ row }) => <span className='tabular-nums'>{computeTransferTotals(row.original).totalUnitsSent} units</span>
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
      const status = TRANSFER_STATUS_BADGE[row.original.status]

      return <Badge className={status.className}>{status.label}</Badge>
    }
  },
  {
    id: 'warehouse',
    accessorFn: row => row.sourceWarehouseId,
    enableHiding: true,
    meta: { label: 'Warehouse' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Warehouse' />,
    filterFn: (row, _id, value) =>
      value === 'all' || row.original.sourceWarehouseId === value || row.original.destinationWarehouseId === value
  },
  {
    id: 'actions',
    size: 60,
    enableHiding: false,
    enableSorting: false,
    meta: { label: 'Actions' },
    header: () => <span className='text-muted-foreground text-sm font-medium'>Actions</span>,
    cell: ({ row }) => <TransferRowActions transfer={row.original} />
  }
]

export default getStockTransferColumns
