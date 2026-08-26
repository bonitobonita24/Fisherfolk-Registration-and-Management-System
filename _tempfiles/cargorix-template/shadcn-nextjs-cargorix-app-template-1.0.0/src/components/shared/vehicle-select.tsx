'use client'

// Third-party Imports
import { BikeIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Util Imports
import { getCapacityKg } from '@/lib/selectors/fleet-selectors'

const DRIVER_STATUS_LABEL: Record<Driver['status'], string> = {
  available: 'Available',
  on_route: 'On route',
  offline: 'Offline'
}

export const getAssignedDriver = (vehicle: Vehicle | undefined, drivers: Driver[]): Driver | undefined =>
  vehicle ? drivers.find(driver => driver.id === vehicle.assignedDriverId) : undefined

export const getDriverStatusLabel = (driver: Driver): string => DRIVER_STATUS_LABEL[driver.status]

type VehicleSelectProps = {
  id: string
  vehicles: Vehicle[]
  drivers: Driver[]
  value: string
  onChange: (vehicleId: string) => void
  emptyLabel: string

  invalid?: boolean
}

const VehicleSelect = ({ id, vehicles, drivers, value, onChange, emptyLabel, invalid }: VehicleSelectProps) => {
  // Vars
  const options = vehicles.map(vehicle => {
    const driver = getAssignedDriver(vehicle, drivers)
    const capacityLabel = `${getCapacityKg(vehicle).toLocaleString()} kg`

    return {
      value: vehicle.id,
      label: `${vehicle.id} · ${vehicle.label} · ${capacityLabel} · ${driver?.name ?? 'No driver assigned'}`,
      title: `${vehicle.id} · ${vehicle.label}`,
      capacityLabel,
      driverName: driver?.name,
      driverStatus: driver ? getDriverStatusLabel(driver) : undefined,
      isBike: vehicle.type === 'motorcycle'
    }
  })

  const items = [{ label: emptyLabel, value: '' }, ...options]

  return (
    <Select items={items} value={value || ''} onValueChange={next => onChange((next as string) ?? '')}>
      <SelectTrigger id={id} className='w-full' aria-invalid={invalid}>
        <SelectValue placeholder={emptyLabel} />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        className='max-h-80 w-auto max-w-(--available-width) min-w-(--anchor-width)'
      >
        <SelectGroup>
          <SelectItem value=''>
            <span className='text-muted-foreground'>{emptyLabel}</span>
          </SelectItem>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              <span className='flex min-w-0 items-center gap-2.5'>
                <span className='bg-accent text-accent-foreground grid size-7 shrink-0 place-items-center rounded-lg'>
                  {option.isBike ? <BikeIcon className='size-3.5' /> : <TruckIcon className='size-3.5' />}
                </span>
                <span className='flex min-w-0 flex-col'>
                  <span className='truncate font-medium'>{option.title}</span>
                  <span className='text-muted-foreground truncate text-xs'>
                    {option.capacityLabel} ·{' '}
                    {option.driverName ? (
                      `${option.driverName} · ${option.driverStatus}`
                    ) : (
                      <span className='text-warning'>No driver assigned</span>
                    )}
                  </span>
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default VehicleSelect
