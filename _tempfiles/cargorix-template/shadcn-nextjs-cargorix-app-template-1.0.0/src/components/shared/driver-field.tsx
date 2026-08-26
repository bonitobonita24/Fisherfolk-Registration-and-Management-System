'use client'

// React Imports
import { useState } from 'react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

// Shared Imports
import { getDriverStatusLabel } from '@/components/shared/vehicle-select'

const isFreeNow = (driver: Driver) => driver.status === 'available'

type DriverFieldProps = {
  id: string
  drivers: Driver[]
  value: string
  onChange: (driverId: string) => void

  vehicle?: Vehicle
}

const DriverField = ({ id, drivers, value, onChange, vehicle }: DriverFieldProps) => {
  // States
  const [isEditing, setIsEditing] = useState(false)

  // Vars
  const selected = drivers.find(driver => driver.id === value)
  const vehicleDriver = vehicle ? drivers.find(driver => driver.id === vehicle.assignedDriverId) : undefined
  const isOverride = Boolean(selected && vehicleDriver && selected.id !== vehicleDriver.id)

  const rosterable = drivers.filter(driver => driver.employmentStatus !== 'inactive' && driver.id !== vehicleDriver?.id)
  const available = rosterable.filter(isFreeNow)
  const busy = rosterable.filter(driver => !isFreeNow(driver))

  const groups = [
    { label: 'Assigned to this vehicle', drivers: vehicleDriver ? [vehicleDriver] : [] },
    { label: 'Available now', drivers: available },
    { label: 'Currently busy', drivers: busy }
  ].filter(group => group.drivers.length > 0)

  const items = groups.flatMap(group =>
    group.drivers.map(driver => ({ label: `${driver.name} · ${getDriverStatusLabel(driver)}`, value: driver.id }))
  )

  const hint = !vehicle
    ? 'Follows the vehicle. Change it on the vehicle record in Fleet.'
    : isOverride
      ? `Overriding ${vehicle.id}'s regular driver (${vehicleDriver?.name}).`
      : selected
        ? `Assigned driver for ${vehicle.id}`
        : vehicleDriver
          ? `${vehicleDriver.name} is ${vehicle.id}'s regular driver — pick them or another driver for this trip.`
          : `${vehicle.id} has no assigned driver — pick one for this trip.`

  return (
    <Field>
      <div className='flex items-center justify-between gap-2'>
        <FieldLabel htmlFor={id}>Driver</FieldLabel>
        <Button
          type='button'
          variant='link'
          size='sm'
          className='h-auto p-0 text-xs'
          onClick={() => setIsEditing(prev => !prev)}
        >
          {isEditing ? 'Cancel' : 'Change'}
        </Button>
      </div>

      {isEditing ? (
        <Select items={items} value={value || ''} onValueChange={next => onChange((next as string) ?? '')}>
          <SelectTrigger id={id} className='w-full'>
            <SelectValue placeholder='Select a driver' />
          </SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            className='max-h-80 w-auto max-w-(--available-width) min-w-(--anchor-width)'
          >
            {groups.map(group => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.drivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <span className='flex min-w-0 flex-col'>
                      <span className='truncate'>{driver.name}</span>
                      <span className='text-muted-foreground truncate text-xs'>{getDriverStatusLabel(driver)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          readOnly
          disabled
          value={selected ? `${selected.name} · ${getDriverStatusLabel(selected)}` : ''}
          placeholder='Select a vehicle to assign its driver'
        />
      )}

      <FieldDescription className={isOverride ? 'text-warning' : undefined}>{hint}</FieldDescription>
    </Field>
  )
}

export default DriverField
