'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'

// Component Imports
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'
import OrderRowActions from './order-row-actions'

// Data Imports
import { ORDER_SOURCE_BADGE, ORDER_STATUS_BADGE } from '../order-badges'

const SERVICE_LEVEL_LABEL: Record<Order['serviceLevel'], string> = {
  regular: 'Regular',
  express: 'Express',
  same_day: 'Same day'
}

const getOrderColumns = (clients: Client[], shipments: Shipment[]): ColumnDef<Order>[] => [
  {
    id: 'order',
    accessorKey: 'displayId',
    meta: { filterVariant: 'text', label: 'Order' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Order' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const order = row.original
      const client = clients.find(c => c.id === order.clientId)

      return (
        order.displayId.toLowerCase().includes(search) ||
        (client?.name.toLowerCase().includes(search) ?? false) ||
        order.pickupAddress.toLowerCase().includes(search) ||
        order.deliveryAddress.toLowerCase().includes(search)
      )
    },
    cell: ({ row }) => {
      const order = row.original

      return (
        <div>
          <Link href={`/orders/${order.id}`} className='font-semibold hover:underline'>
            {order.displayId}
          </Link>
          <div className='text-muted-foreground mt-1 flex items-center gap-2 text-xs'>
            <span>{format(new Date(order.createdAt), 'd MMM yyyy · HH:mm')}</span>
            {order.status === 'draft' ? (
              <Badge variant='outline'>Draft</Badge>
            ) : (
              <Badge className={ORDER_SOURCE_BADGE[order.source].className}>
                {ORDER_SOURCE_BADGE[order.source].label}
              </Badge>
            )}
          </div>
        </div>
      )
    }
  },
  {
    id: 'client',
    accessorFn: row => clients.find(c => c.id === row.clientId)?.name ?? '',
    meta: { label: 'Client' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Client' />,
    cell: ({ row }) => {
      const client = clients.find(c => c.id === row.original.clientId)

      if (!client) return <span className='text-muted-foreground'>—</span>

      return (
        <div className='flex items-center gap-3'>
          <span className='bg-muted text-muted-foreground grid size-9 place-items-center rounded-full text-xs font-medium'>
            {client.avatarInitials}
          </span>
          <div>
            <p className='font-medium'>{client.name}</p>
            <p className='text-muted-foreground text-xs'>{client.industry}</p>
          </div>
        </div>
      )
    }
  },
  {
    id: 'route',
    accessorFn: row => row.pickupAddress,
    meta: { label: 'Route' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Route' />,
    cell: ({ row }) => (
      <div>
        <p className='font-medium'>{row.original.pickupAddress}</p>
        <p className='text-muted-foreground mt-1 text-xs'>→ {row.original.deliveryAddress}</p>
      </div>
    )
  },
  {
    id: 'service',
    accessorKey: 'serviceLevel',
    meta: { label: 'Service' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Service' />,
    cell: ({ row }) => SERVICE_LEVEL_LABEL[row.original.serviceLevel]
  },
  {
    id: 'packages',
    accessorFn: row => row.packages.reduce((sum, p) => sum + p.quantity, 0),
    meta: { label: 'Packages' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Packages' />,
    cell: ({ row }) => {
      const order = row.original
      const totalQty = order.packages.reduce((sum, p) => sum + p.quantity, 0)
      const totalWeight = order.packages.reduce((sum, p) => sum + p.weightKg, 0)

      return (
        <div>
          <p className='font-medium'>
            {totalQty} package{totalQty === 1 ? '' : 's'}
          </p>
          <p className='text-muted-foreground mt-1 text-xs'>{totalWeight.toLocaleString()} kg</p>
        </div>
      )
    }
  },
  {
    id: 'shipment',
    accessorFn: row => shipments.find(s => s.id === row.shipmentId)?.displayId ?? '',
    meta: { label: 'Shipment' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Shipment' />,
    cell: ({ row }) => {
      const shipment = shipments.find(s => s.id === row.original.shipmentId)

      if (!shipment) return <span className='text-muted-foreground'>—</span>

      return <Badge className='bg-info-soft text-info'>{shipment.displayId}</Badge>
    }
  },
  {
    id: 'total',
    accessorKey: 'totalAmount',
    meta: { label: 'Total' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Total' />,
    cell: ({ row }) => <span className='font-semibold tabular-nums'>${row.original.totalAmount.toFixed(2)}</span>
  },
  {
    id: 'status',
    accessorKey: 'status',
    meta: { filterVariant: 'select', label: 'Status' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    cell: ({ row }) => {
      const status = ORDER_STATUS_BADGE[row.original.status]

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
    cell: ({ row }) => <OrderRowActions order={row.original} />
  }
]

export default getOrderColumns
