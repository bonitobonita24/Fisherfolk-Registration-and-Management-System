'use client'

// Type Imports
import type { Driver } from '@/types/entities/driver'

// Component Imports
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Props
type AssignedDriverSelectProps = {
  id: string
  drivers: Driver[]
  value: string
  onChange: (value: string) => void
  vehicleId?: string
}

const UNASSIGNED = ''

export const getDriverCurrentVehicle = (driver: Driver, vehicleId?: string) => {
  const held = driver.assignedVehicle?.vehicleNo ?? driver.assignedVehicle?.vehicleId

  if (!held || held === vehicleId) return undefined

  return held
}

const AssignedDriverSelect = ({ id, drivers, value, onChange, vehicleId }: AssignedDriverSelectProps) => {
  // Vars
  const items = [
    { label: 'Unassigned', value: UNASSIGNED },
    ...drivers.map(driver => {
      const held = getDriverCurrentVehicle(driver, vehicleId)

      return { label: held ? `${driver.name} · on ${held}` : driver.name, value: driver.id }
    })
  ]

  const selected = drivers.find(driver => driver.id === value)
  const selectedHeldBy = selected ? getDriverCurrentVehicle(selected, vehicleId) : undefined

  return (
    <Field>
      <FieldLabel htmlFor={id}>Assigned Driver</FieldLabel>
      <Select items={items} value={value ?? UNASSIGNED} onValueChange={next => onChange(next ?? UNASSIGNED)}>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder='Select a driver' />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} className='w-auto max-w-(--available-width) min-w-(--anchor-width)'>
          <SelectGroup>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {drivers.map(driver => {
              const held = getDriverCurrentVehicle(driver, vehicleId)

              return (
                <SelectItem key={driver.id} value={driver.id}>
                  <span className='flex flex-col'>
                    <span>{driver.name}</span>
                    <span className={held ? 'text-warning text-xs' : 'text-muted-foreground text-xs'}>
                      {held ? `Currently on ${held}` : 'No vehicle assigned'}
                    </span>
                  </span>
                </SelectItem>
              )
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
      {selectedHeldBy && (
        <FieldDescription className='text-warning'>
          {selected?.name} is currently on {selectedHeldBy} and will be moved off it when you save.
        </FieldDescription>
      )}
    </Field>
  )
}

export default AssignedDriverSelect
