'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { ListFilterIcon, SearchIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import ShipmentTrackingCard from './shipment-tracking-card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

// Data Imports
import { SHIPMENT_STATUS_OPTIONS } from '../shipment-badges'

type TrackingListProps = {
  shipments: Shipment[]
  orders: Order[]
  clients: Client[]
  drivers: Driver[]
  vehicles: Vehicle[]
  selectedShipmentId?: string
}

const TrackingList = ({ shipments, orders, clients, drivers, vehicles, selectedShipmentId }: TrackingListProps) => {
  // States
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  // Vars
  const isFiltered = status !== 'all'
  const statusLabel = SHIPMENT_STATUS_OPTIONS.find(option => option.value === status)?.label ?? 'All statuses'

  const filtered = shipments.filter(shipment => {
    if (status !== 'all' && shipment.status !== status) return false
    if (!search) return true

    const order = orders.find(o => o.id === shipment.orderId)
    const client = clients.find(c => c.id === order?.clientId)
    const haystack = `${shipment.displayId} ${order?.displayId ?? ''} ${client?.name ?? ''}`.toLowerCase()

    return haystack.includes(search.toLowerCase())
  })

  return (
    <Card className='absolute inset-0 gap-0 py-0'>
      <CardHeader className='space-y-3 border-b px-4 py-4'>
        <CardTitle className='font-semibold'>Tracking list</CardTitle>
        <div className='flex items-center gap-2'>
          <InputGroup className='max-w-xs'>
            <InputGroupInput
              className='input-default'
              onChange={e => setSearch(e.target.value)}
              placeholder='Search shipments...'
              aria-label='Search shipments'
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant={isFiltered ? 'secondary' : 'outline'}
                  size='icon'
                  className='relative shrink-0'
                  aria-label={`Filter by status: ${statusLabel}`}
                />
              }
            >
              <ListFilterIcon className='size-4' />
              {isFiltered && (
                <span className='bg-primary ring-card absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2' />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-fit'>
              <DropdownMenuRadioGroup value={status} onValueChange={value => setStatus(value as string)}>
                {SHIPMENT_STATUS_OPTIONS.map(option => (
                  <DropdownMenuRadioItem key={option.value} value={option.value} closeOnClick>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className='flex min-h-0 flex-1 flex-col p-0'>
        <ScrollArea className='min-h-0 flex-1 max-md:h-150'>
          <div className='divide-y'>
            {filtered.map(shipment => {
              const order = orders.find(o => o.id === shipment.orderId)
              const client = clients.find(c => c.id === order?.clientId)
              const driver = drivers.find(d => d.id === shipment.driverId)
              const vehicle = vehicles.find(v => v.id === shipment.vehicleId)

              return (
                <ShipmentTrackingCard
                  key={shipment.id}
                  shipment={shipment}
                  order={order}
                  client={client}
                  driver={driver}
                  vehicle={vehicle}
                  isSelected={shipment.id === selectedShipmentId}
                />
              )
            })}
            {filtered.length === 0 && (
              <p className='text-muted-foreground p-4 text-center text-sm'>No shipments found.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default TrackingList
