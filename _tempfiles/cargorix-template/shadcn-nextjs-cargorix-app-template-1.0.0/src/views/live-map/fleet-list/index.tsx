'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChevronRightIcon, ListFilterIcon, SearchIcon } from 'lucide-react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Vehicle, VehicleTrackingStatus } from '@/types/entities/vehicle'

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
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import FleetVehicleCard from './fleet-vehicle-card'

// Data Imports
import { VEHICLE_STATUS_OPTIONS } from '../fleet-badges'

type SortBy = 'status' | 'eta' | 'driver'

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: 'Status', value: 'status' },
  { label: 'ETA', value: 'eta' },
  { label: 'Driver', value: 'driver' }
]

const STATUS_ORDER: Record<VehicleTrackingStatus, number> = { delayed: 0, on_route: 1, completed: 2, idle: 3 }

type FleetListProps = {
  vehicles: Vehicle[]
  drivers: Driver[]
  selectedVehicleId?: string
}

const FleetList = ({ vehicles, drivers, selectedVehicleId }: FleetListProps) => {
  // States
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sortBy, setSortBy] = useState<SortBy>('status')

  // Vars
  const isFiltered = status !== 'all'
  const statusLabel = VEHICLE_STATUS_OPTIONS.find(option => option.value === status)?.label ?? 'All statuses'

  const filtered = vehicles.filter(vehicle => {
    if (status !== 'all' && vehicle.trackingStatus !== status) return false
    if (!search) return true

    const driver = drivers.find(d => d.id === vehicle.assignedDriverId)

    const haystack =
      `${vehicle.id} ${driver?.name ?? ''} ${vehicle.nextStopLabel ?? ''} ${vehicle.currentLocationLabel ?? ''}`.toLowerCase()

    return haystack.includes(search.toLowerCase())
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'status') return STATUS_ORDER[a.trackingStatus] - STATUS_ORDER[b.trackingStatus]
    if (sortBy === 'eta') return (a.etaAt ?? '').localeCompare(b.etaAt ?? '')

    const driverA = drivers.find(d => d.id === a.assignedDriverId)?.name ?? ''
    const driverB = drivers.find(d => d.id === b.assignedDriverId)?.name ?? ''

    return driverA.localeCompare(driverB)
  })

  return (
    <Card className='absolute inset-0 gap-0 py-0'>
      <CardHeader className='space-y-3 border-b p-4'>
        <CardTitle className='font-semibold'>Active fleet</CardTitle>
        <div className='flex items-center gap-2'>
          <InputGroup className='flex-1'>
            <InputGroupInput
              className='input-default'
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search fleet...'
              aria-label='Search vehicle, driver or stop'
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
                {VEHICLE_STATUS_OPTIONS.map(option => (
                  <DropdownMenuRadioItem key={option.value} value={option.value} closeOnClick>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className='flex items-center justify-between'>
          <p className='text-muted-foreground text-xs'>
            {sorted.length === vehicles.length
              ? `${vehicles.length} vehicles`
              : `${sorted.length} of ${vehicles.length} vehicles`}
          </p>
          <Select items={SORT_OPTIONS} value={sortBy} onValueChange={value => setSortBy(value as SortBy)}>
            <SelectTrigger className='input-sm gap-1 border-none px-1.5 text-xs shadow-none' aria-label='Sort vehicles'>
              <span className='text-muted-foreground'>Sort:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              align='end'
              className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
            >
              <SelectGroup>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className='flex min-h-0 flex-1 flex-col p-0'>
        <ScrollArea className='min-h-0 flex-1'>
          <div className='divide-y'>
            {sorted.map(vehicle => (
              <FleetVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                driver={drivers.find(d => d.id === vehicle.assignedDriverId)}
                isSelected={vehicle.id === selectedVehicleId}
              />
            ))}
            {sorted.length === 0 && <p className='text-muted-foreground p-4 text-center text-sm'>No vehicles found.</p>}
          </div>
        </ScrollArea>
        <div className='shrink-0 border-t p-2'>
          <Button
            variant='ghost'
            className='w-full justify-between text-sm'
            render={<Link href='/fleet' />}
            nativeButton={false}
          >
            View all vehicles
            <ChevronRightIcon className='size-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default FleetList
