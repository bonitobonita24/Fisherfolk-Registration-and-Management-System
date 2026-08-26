'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { MapPinIcon } from 'lucide-react'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'
import SupplierRowActions from './supplier-row-actions'

// Util Imports
import { getInitials } from '@/lib/get-initials'
import { getSupplierRollup } from '@/lib/selectors/supplier-selectors'
import { cn } from '@/lib/utils'

// Data Imports
import { SUPPLIER_STATUS_BADGE } from '../supplier-badges'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const getSupplierColumns = (purchaseOrders: PurchaseOrder[]): ColumnDef<Supplier>[] => [
  {
    id: 'supplier',
    accessorFn: row => row.name,
    meta: { filterVariant: 'text', label: 'Supplier' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Supplier' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const s = row.original

      return (
        s.name.toLowerCase().includes(search) ||
        Boolean(s.supplierCode?.toLowerCase().includes(search)) ||
        s.contactPerson.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search) ||
        s.phone.toLowerCase().includes(search)
      )
    },
    cell: ({ row }) => {
      const s = row.original

      return (
        <div className='flex items-center gap-3'>
          <Avatar className='size-9'>
            <AvatarFallback className='bg-muted text-muted-foreground text-xs'>{getInitials(s.name)}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-foreground font-semibold'>{s.name}</span>
            {s.supplierCode && <span className='text-muted-foreground text-xs'>{s.supplierCode}</span>}
          </div>
        </div>
      )
    }
  },
  {
    id: 'contact',
    accessorFn: row => row.contactPerson,
    enableSorting: false,
    meta: { label: 'Contact' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Contact' />,
    cell: ({ row }) => {
      const s = row.original

      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{s.contactPerson}</span>
          <span className='text-muted-foreground text-xs'>{s.email}</span>
          <span className='text-muted-foreground text-xs'>{s.phone}</span>
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
      const s = row.original
      const place = [s.city, s.state].filter(Boolean).join(', ')

      if (!place && !s.country) return <span className='text-muted-foreground'>—</span>

      return (
        <div className='flex flex-col'>
          <span className='flex items-center gap-1.5'>
            <MapPinIcon className='text-muted-foreground size-3.5' />
            {place || '—'}
          </span>
          {s.country && <span className='text-muted-foreground text-xs'>{s.country}</span>}
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
      const badge = SUPPLIER_STATUS_BADGE[row.original.status ?? 'inactive']

      return (
        <Badge className={cn('gap-1.5', badge.className)}>
          <span className={cn('size-1.5 shrink-0 rounded-full', badge.dot)} />
          {badge.label}
        </Badge>
      )
    }
  },
  {
    id: 'openPOs',
    accessorFn: row => getSupplierRollup(row, purchaseOrders).openPOs,
    meta: { label: 'Open POs' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Open POs' className='justify-end' />,
    cell: ({ row }) => {
      const openPOs = getSupplierRollup(row.original, purchaseOrders).openPOs

      return <div className={cn('text-right tabular-nums', openPOs === 0 && 'text-muted-foreground')}>{openPOs}</div>
    }
  },
  {
    id: 'productsSupplied',
    accessorFn: row => (row.productsSupplied ?? []).join(', '),
    enableSorting: false,
    meta: { label: 'Products supplied' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Products supplied' />,
    cell: ({ row }) => {
      const products = (row.original.productsSupplied ?? []).join(', ')

      if (!products) return <span className='text-muted-foreground'>—</span>

      return (
        <span className='block max-w-48 truncate' title={products}>
          {products}
        </span>
      )
    }
  },
  {
    id: 'leadTime',
    accessorFn: row => row.leadTimeDays ?? 0,
    meta: { label: 'Lead time' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Lead time' className='justify-end' />,
    cell: ({ row }) =>
      typeof row.original.leadTimeDays === 'number' ? (
        <div className='text-right whitespace-nowrap tabular-nums'>{row.original.leadTimeDays} days</div>
      ) : (
        <div className='text-muted-foreground text-right'>—</div>
      )
  },
  {
    id: 'totalPurchased',
    accessorFn: row => getSupplierRollup(row, purchaseOrders).totalPurchased,
    meta: { label: 'Total purchased' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Total purchased' className='justify-end' />,
    cell: ({ row }) => (
      <div className='text-right font-medium tabular-nums'>
        {currency.format(getSupplierRollup(row.original, purchaseOrders).totalPurchased)}
      </div>
    )
  },
  {
    id: 'category',
    accessorFn: row => row.category ?? '',
    meta: { filterVariant: 'select', label: 'Category' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Category' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    cell: ({ row }) =>
      row.original.category ? (
        <span className='whitespace-nowrap'>{row.original.category}</span>
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
    cell: ({ row }) => <SupplierRowActions supplier={row.original} />
  }
]

export default getSupplierColumns
