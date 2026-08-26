'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'

// Type Imports
import type { StockMovementRow } from '@/types/entities/stock-movement'
import type { DateRangeValue } from '../ledger-badges'

// Component Imports
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'
import LedgerRowActions from './ledger-row-actions'

// Util Imports
import { matchesDateRange } from '@/lib/selectors/stock-ledger-selectors'

// Data Imports
import { MOVEMENT_TYPE_BADGE } from '../ledger-badges'

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

const getLedgerColumns = (now: number): ColumnDef<StockMovementRow>[] => [
  {
    id: 'date',
    accessorKey: 'date',
    meta: { label: 'Date' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
    filterFn: (row, _id, value: DateRangeValue) => matchesDateRange(row.original.date, value, now),
    cell: ({ row }) => {
      const date = new Date(row.original.date)

      return (
        <div className='whitespace-nowrap'>
          <p className='text-sm font-medium'>{dateFormatter.format(date)}</p>
          <p className='text-muted-foreground text-xs tabular-nums'>{timeFormatter.format(date)}</p>
        </div>
      )
    }
  },
  {
    id: 'product',
    accessorKey: 'name',
    meta: { filterVariant: 'text', label: 'Product' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const m = row.original

      return (
        m.name.toLowerCase().includes(search) ||
        m.sku.toLowerCase().includes(search) ||
        m.reference.toLowerCase().includes(search)
      )
    },
    cell: ({ row }) => {
      const m = row.original

      return (
        <div className='flex items-center gap-3'>
          <img
            src={m.primaryImage}
            alt={m.name}
            loading='lazy'
            className='bg-muted size-10 shrink-0 rounded-md object-cover'
          />
          <div className='min-w-0'>
            <p className='truncate font-medium'>{m.name}</p>
            <p className='text-muted-foreground mt-0.5 text-xs'>{m.sku}</p>
          </div>
        </div>
      )
    }
  },
  {
    id: 'warehouse',
    accessorKey: 'warehouseName',
    meta: { filterVariant: 'select', label: 'Warehouse' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Warehouse' />,
    filterFn: (row, _id, value: string) => row.original.warehouseId === value,
    cell: ({ row }) => <span className='whitespace-nowrap'>{row.original.warehouseName}</span>
  },
  {
    id: 'type',
    accessorKey: 'type',
    meta: { filterVariant: 'select', label: 'Type' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
    cell: ({ row }) => {
      const badge = MOVEMENT_TYPE_BADGE[row.original.type]

      return <Badge className={badge.className}>{badge.label}</Badge>
    }
  },
  {
    id: 'reference',
    accessorKey: 'reference',
    meta: { label: 'Reference' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Reference' />,
    cell: ({ row }) => <span className='text-muted-foreground font-mono text-xs'>{row.original.reference}</span>
  },
  {
    id: 'in',
    accessorFn: row => (row.quantity > 0 ? row.quantity : 0),
    meta: { label: 'In' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='In' />,
    cell: ({ row }) =>
      row.original.quantity > 0 ? (
        <span className='text-success font-medium tabular-nums'>+{row.original.quantity}</span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
  },
  {
    id: 'out',
    accessorFn: row => (row.quantity < 0 ? -row.quantity : 0),
    meta: { label: 'Out' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Out' />,
    cell: ({ row }) =>
      row.original.quantity < 0 ? (
        <span className='text-destructive font-medium tabular-nums'>{row.original.quantity}</span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
  },
  {
    id: 'balance',
    accessorKey: 'balance',
    meta: { label: 'Balance' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Balance' />,
    cell: ({ row }) => <span className='font-semibold tabular-nums'>{row.original.balance}</span>
  },
  {
    id: 'actions',
    size: 60,
    enableHiding: false,
    enableSorting: false,
    meta: { label: 'Actions' },
    header: () => <span className='text-muted-foreground text-sm font-medium'>Actions</span>,
    cell: ({ row }) => <LedgerRowActions movement={row.original} />
  }
]

export default getLedgerColumns
