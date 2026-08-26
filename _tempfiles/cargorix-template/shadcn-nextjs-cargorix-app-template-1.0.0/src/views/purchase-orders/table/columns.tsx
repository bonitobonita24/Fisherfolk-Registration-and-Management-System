'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'

// Component Imports
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'
import PoRowActions from './po-row-actions'

// Util Imports
import { computePurchaseOrderTotals } from '@/lib/selectors/purchase-orders-selectors'

// Data Imports
import { PO_STATUS_BADGE } from '../po-badges'

const getPurchaseOrderColumns = (): ColumnDef<PurchaseOrder>[] => [
  {
    id: 'number',
    accessorKey: 'number',
    meta: { filterVariant: 'text', label: 'PO' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='PO' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const po = row.original

      return po.number.toLowerCase().includes(search) || po.supplier.name.toLowerCase().includes(search)
    },
    cell: ({ row }) => <span className='text-foreground font-semibold'>{row.original.number}</span>
  },
  {
    id: 'supplier',
    accessorFn: row => row.supplier.name,
    meta: { filterVariant: 'text', label: 'Supplier' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Supplier' />
  },
  {
    id: 'warehouse',
    accessorKey: 'warehouseName',
    meta: { label: 'Warehouse' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Warehouse' />
  },
  {
    id: 'lineItems',
    accessorFn: row => row.lines.length,
    meta: { label: 'Line items' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Line items' />
  },
  {
    id: 'totalValue',
    accessorFn: row => computePurchaseOrderTotals(row).grandTotal,
    meta: { label: 'Total value' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Total value' />,
    cell: ({ row }) => {
      const { grandTotal } = computePurchaseOrderTotals(row.original)

      return (
        <span className='tabular-nums'>
          ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    }
  },
  {
    id: 'expected',
    accessorKey: 'expectedDeliveryDate',
    meta: { label: 'Expected' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Expected' />,
    cell: ({ row }) =>
      row.original.expectedDeliveryDate ? (
        <span>{format(new Date(row.original.expectedDeliveryDate), 'MMM d, yyyy')}</span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
  },
  {
    id: 'createdBy',
    accessorKey: 'buyer',
    meta: { label: 'Created by' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Created by' />
  },
  {
    id: 'status',
    accessorKey: 'status',
    meta: { filterVariant: 'select', label: 'Status' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    cell: ({ row }) => {
      const status = PO_STATUS_BADGE[row.original.status]

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
    cell: ({ row }) => <PoRowActions po={row.original} />
  }
]

export default getPurchaseOrderColumns
