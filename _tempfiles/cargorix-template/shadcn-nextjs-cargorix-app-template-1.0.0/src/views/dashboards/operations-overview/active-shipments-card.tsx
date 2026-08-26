'use client'

// React Imports
import { useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import type { PaginationState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table'
import { ArrowRightIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import activeShipmentColumns from './active-shipments-columns'

// Shared Imports
import TablePagination from '@/components/shared/table-pagination'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'

// Util Imports
import { getActiveShipments } from '@/lib/selectors/operations-selectors'
import { cn } from '@/lib/utils'

type ActiveShipmentsCardProps = {
  className?: string
}

const ActiveShipmentsCard = ({ className }: ActiveShipmentsCardProps) => {
  // States
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 })

  // Hooks
  const router = useRouter()
  const shipments = useShipmentsStore(state => state.shipments)
  const orders = useOrdersStore(state => state.orders)
  const vehicles = useVehiclesStore(state => state.vehicles)

  const data = useMemo(() => getActiveShipments(shipments, orders, vehicles), [shipments, orders, vehicles])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: activeShipmentColumns,
    getRowId: row => row.shipmentId,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting: false,
    autoResetPageIndex: false
  })

  return (
    <Card className={cn('gap-0 py-0', className)}>
      <div className='flex min-h-17 flex-wrap items-center justify-between gap-3 border-b px-4 py-3'>
        <div className='flex flex-col'>
          <span className='text-base font-medium'>Active shipments</span>
          <span className='text-muted-foreground text-sm'>
            {data.length} shipment{data.length === 1 ? '' : 's'} scheduled or in transit
          </span>
        </div>
        <Button size='sm' variant='outline' render={<Link href='/shipments' />} nativeButton={false}>
          View all
          <ArrowRightIcon data-icon='inline-end' />
        </Button>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id} className='hover:bg-transparent'>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id} className='text-muted-foreground h-12 px-4 text-sm font-medium'>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row => {
              const href = `/shipments/${row.original.shipmentId}`

              return (
                <TableRow
                  key={row.id}
                  role='link'
                  tabIndex={0}
                  aria-label={`Open shipment ${row.original.displayId}`}
                  onClick={() => router.push(href)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') router.push(href)
                  }}
                  className='focus-visible:ring-ring/50 cursor-pointer focus-visible:ring-2 focus-visible:outline-none'
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className='px-4 py-3.5'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          ) : (
            <TableRow className='hover:bg-transparent'>
              <TableCell colSpan={activeShipmentColumns.length} className='text-muted-foreground h-24 text-center'>
                No active shipments right now.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination table={table} noun='shipments' />
    </Card>
  )
}

export default ActiveShipmentsCard
