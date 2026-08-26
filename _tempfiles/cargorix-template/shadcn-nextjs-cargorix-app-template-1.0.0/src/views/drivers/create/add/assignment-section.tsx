'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { BriefcaseIcon } from 'lucide-react'

// Type Imports
import type { CreateDriverFormInput } from '../driver-form-schema'
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Util Imports
import { DRIVER_STATUS_OPTIONS } from '../../driver-badges'

// Data Imports
import {
  DRIVER_TYPE_OPTIONS,
  HOME_TIME_OPTIONS,
  OPERATING_ZONE_OPTIONS,
  PAY_TYPE_OPTIONS,
  SHIFT_OPTIONS
} from '../driver-form-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type AssignmentSectionProps = {
  control: Control<CreateDriverFormInput>
  vehicles: Vehicle[]
  warehouses: Warehouse[]
  drivers?: Driver[]
  driverId?: string
}

const AssignmentSection = ({ control, vehicles, warehouses, drivers = [], driverId }: AssignmentSectionProps) => {
  // Vars
  const hubItems = warehouses.map(warehouse => ({ label: warehouse.name, value: warehouse.id }))

  const heldBy = (vehicle: Vehicle) => {
    if (!vehicle.assignedDriverId || vehicle.assignedDriverId === driverId) return undefined

    return drivers.find(driver => driver.id === vehicle.assignedDriverId)?.name
  }

  const vehicleItems = [
    { label: 'Unassigned', value: 'none' },
    ...vehicles.map(vehicle => {
      const holder = heldBy(vehicle)

      return {
        label: holder ? `${vehicle.id} · ${vehicle.label} · ${holder}` : `${vehicle.id} · ${vehicle.label}`,
        value: vehicle.id
      }
    })
  ]

  const statusItems = DRIVER_STATUS_OPTIONS.filter(option => option.value !== 'all')

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <BriefcaseIcon className='size-5' />
          Assignment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Controller
            name='homeHubId'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-home-hub'>
                  Home Hub <RequiredMark />
                </FieldLabel>
                <Select items={hubItems} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='driver-home-hub' className='w-full'>
                    <SelectValue placeholder='Select a hub' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {hubItems.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='assignedVehicleId'
            control={control}
            render={({ field }) => {
              const selectedVehicle = vehicles.find(vehicle => vehicle.id === field.value)
              const selectedHolder = selectedVehicle ? heldBy(selectedVehicle) : undefined

              return (
                <Field>
                  <FieldLabel htmlFor='driver-assigned-vehicle'>Assigned Vehicle</FieldLabel>
                  <Select
                    items={vehicleItems}
                    value={field.value || 'none'}
                    onValueChange={value => field.onChange(value === 'none' ? '' : value)}
                  >
                    <SelectTrigger id='driver-assigned-vehicle' className='w-full'>
                      <SelectValue placeholder='Select a vehicle' />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                    >
                      <SelectGroup>
                        <SelectItem value='none'>Unassigned</SelectItem>
                        {vehicles.map(vehicle => {
                          const holder = heldBy(vehicle)

                          return (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              <span className='flex flex-col'>
                                <span>{`${vehicle.id} · ${vehicle.label}`}</span>
                                <span className={holder ? 'text-warning text-xs' : 'text-muted-foreground text-xs'}>
                                  {holder ? `Currently driven by ${holder}` : 'No driver assigned'}
                                </span>
                              </span>
                            </SelectItem>
                          )
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {selectedHolder && (
                    <FieldDescription className='text-warning'>
                      {selectedHolder} currently drives this vehicle and will be unassigned when you save.
                    </FieldDescription>
                  )}
                </Field>
              )
            }}
          />

          <Controller
            name='operatingZone'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='driver-operating-zone'>Operating Zone</FieldLabel>
                <Select
                  items={OPERATING_ZONE_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='driver-operating-zone' className='w-full'>
                    <SelectValue placeholder='Select a zone' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {OPERATING_ZONE_OPTIONS.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name='shift'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-shift'>
                  Shift <RequiredMark />
                </FieldLabel>
                <Select items={SHIFT_OPTIONS} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='driver-shift' className='w-full'>
                    <SelectValue placeholder='Select a shift' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {SHIFT_OPTIONS.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='driverType'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='driver-type'>Driver Type</FieldLabel>
                <Select
                  items={DRIVER_TYPE_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='driver-type' className='w-full'>
                    <SelectValue placeholder='Select a type' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {DRIVER_TYPE_OPTIONS.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name='homeTime'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='driver-home-time'>Home Time</FieldLabel>
                <Select
                  items={HOME_TIME_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='driver-home-time' className='w-full'>
                    <SelectValue placeholder='Select home time' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {HOME_TIME_OPTIONS.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name='payType'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='driver-pay-type'>Pay Type</FieldLabel>
                <Select
                  items={PAY_TYPE_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='driver-pay-type' className='w-full'>
                    <SelectValue placeholder='Select pay type' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {PAY_TYPE_OPTIONS.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name='employmentStatus'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-status'>
                  Status <RequiredMark />
                </FieldLabel>
                <Select items={statusItems} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='driver-status' className='w-full'>
                    <SelectValue placeholder='Select a status' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {statusItems.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default AssignmentSection
