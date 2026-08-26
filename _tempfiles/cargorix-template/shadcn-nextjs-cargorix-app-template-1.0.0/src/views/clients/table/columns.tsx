'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { MapPinIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'

// Component Imports
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import ClientRowActions from './client-row-actions'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'

// Util Imports
import { getClientRollup } from '@/lib/selectors/client-selectors'
import { cn } from '@/lib/utils'

// Data Imports
import { CLIENT_STATUS_BADGE } from '../client-badges'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const getClientColumns = (orders: Order[], shipments: Shipment[]): ColumnDef<Client>[] => [
  {
    id: 'client',
    accessorFn: row => row.name,
    meta: { filterVariant: 'text', label: 'Client' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Client' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const c = row.original

      return (
        c.name.toLowerCase().includes(search) ||
        Boolean(c.clientCode?.toLowerCase().includes(search)) ||
        c.contactName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.phone.toLowerCase().includes(search)
      )
    },
    cell: ({ row }) => {
      const c = row.original

      return (
        <div className='flex items-center gap-3'>
          <Avatar className='size-9'>
            <AvatarFallback className='bg-muted text-muted-foreground text-xs'>{c.avatarInitials}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-foreground font-semibold'>{c.name}</span>
            {c.clientCode && <span className='text-muted-foreground text-xs'>{c.clientCode}</span>}
          </div>
        </div>
      )
    }
  },
  {
    id: 'contact',
    accessorFn: row => row.contactName,
    enableSorting: false,
    meta: { label: 'Contact' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Contact' />,
    cell: ({ row }) => {
      const c = row.original

      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{c.contactName}</span>
          <span className='text-muted-foreground text-xs'>{c.email}</span>
          <span className='text-muted-foreground text-xs'>{c.phone}</span>
        </div>
      )
    }
  },
  {
    id: 'location',
    accessorFn: row => [row.city, row.state].filter(Boolean).join(', '),
    meta: { filterVariant: 'select', label: 'Location' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Location' />,
    filterFn: (row, _id, value: string) => value === 'all' || row.original.state === value,
    cell: ({ row }) => {
      const c = row.original
      const place = [c.city, c.state].filter(Boolean).join(', ')

      if (!place && !c.country) return <span className='text-muted-foreground'>—</span>

      return (
        <div className='flex flex-col'>
          <span className='flex items-center gap-1.5'>
            <MapPinIcon className='text-muted-foreground size-3.5' />
            {place || '—'}
          </span>
          {c.country && <span className='text-muted-foreground text-xs'>{c.country}</span>}
        </div>
      )
    }
  },
  {
    id: 'status',
    accessorFn: row => row.status ?? 'inactive',
    meta: { filterVariant: 'select', label: 'Status' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    cell: ({ row }) => {
      const badge = CLIENT_STATUS_BADGE[row.original.status ?? 'inactive']

      return (
        <Badge className={cn('gap-1.5', badge.className)}>
          <span className={cn('size-1.5 shrink-0 rounded-full', badge.dot)} />
          {badge.label}
        </Badge>
      )
    }
  },
  {
    id: 'orders',
    accessorFn: row => getClientRollup(row, orders, shipments).ordersCount,
    meta: { label: 'Orders' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Orders' className='justify-end' />,
    cell: ({ row }) => (
      <div className='text-right tabular-nums'>{getClientRollup(row.original, orders, shipments).ordersCount}</div>
    )
  },
  {
    id: 'activeShipments',
    accessorFn: row => getClientRollup(row, orders, shipments).activeShipments,
    meta: { label: 'Active shipments' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Active shipments' className='justify-end' />,
    cell: ({ row }) => (
      <div className='text-right tabular-nums'>{getClientRollup(row.original, orders, shipments).activeShipments}</div>
    )
  },
  {
    id: 'outstandingBalance',
    accessorFn: row => getClientRollup(row, orders, shipments).outstandingBalance,
    meta: { label: 'Open order value' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Open order value' className='justify-end' />,
    cell: ({ row }) => {
      const balance = getClientRollup(row.original, orders, shipments).outstandingBalance

      return (
        <div className={cn('text-right tabular-nums', balance === 0 && 'text-muted-foreground')}>
          {currency.format(balance)}
        </div>
      )
    }
  },
  {
    id: 'lifetimeValue',
    accessorFn: row => getClientRollup(row, orders, shipments).lifetimeValue,
    meta: { label: 'Lifetime value' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Lifetime value' className='justify-end' />,
    cell: ({ row }) => (
      <div className='text-right font-medium tabular-nums'>
        {currency.format(getClientRollup(row.original, orders, shipments).lifetimeValue)}
      </div>
    )
  },
  {
    id: 'accountManager',
    accessorFn: row => row.accountManager ?? '',
    meta: { filterVariant: 'select', label: 'Account manager' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Account manager' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    cell: ({ row }) =>
      row.original.accountManager ? (
        <span>{row.original.accountManager}</span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
  },
  {
    id: 'actions',
    size: 60,
    enableHiding: false,
    enableSorting: false,
    meta: { label: 'Actions' },
    header: () => <span className='text-muted-foreground text-sm font-medium'>Actions</span>,
    cell: ({ row }) => <ClientRowActions client={row.original} />
  }
]

export default getClientColumns
