'use client'

// Third-party Imports
import { Controller, useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { BadgeCheckIcon } from 'lucide-react'

// Type Imports
import type { CreateShipmentFormInput } from './create-shipment-schema'
import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Util Imports
import { getCapacityKg } from '@/lib/selectors/fleet-selectors'

// Shared Imports
import DriverField from '@/components/shared/driver-field'
import RequiredMark from '@/components/shared/required-mark'
import VehicleSelect from '@/components/shared/vehicle-select'

const CARRIER_OPTIONS = [
  { label: 'Internal Fleet · Newark-369', value: 'Internal Fleet' },
  { label: 'SwiftHaul Partner', value: 'SwiftHaul Partner' }
]

type ResourcesSectionProps = {
  control: Control<CreateShipmentFormInput>
  setValue: UseFormSetValue<CreateShipmentFormInput>
  drivers: Driver[]
  vehicles: Vehicle[]
  order: Order
}

const ResourcesSection = ({ control, setValue, drivers, vehicles, order }: ResourcesSectionProps) => {
  const values = useWatch({ control })
  const selectedVehicle = vehicles.find(v => v.id === values.vehicleId)
  const totalWeightKg = order.packages.reduce((sum, p) => sum + p.weightKg, 0)
  const hasCapacity = selectedVehicle ? selectedVehicle.capacityTons * 1000 >= totalWeightKg : null

  return (
    <Card className='gap-0 py-0 lg:max-xl:order-1 lg:max-xl:col-span-2'>
      <CardHeader className='border-b p-4'>
        <CardTitle>Resources</CardTitle>
        <p className='text-muted-foreground text-sm'>
          Pick the vehicle the load needs — its driver is filled in automatically
        </p>
      </CardHeader>
      <CardContent className='space-y-4 p-4'>
        <FieldGroup className='grid gap-4 sm:grid-cols-2'>
          <Controller
            name='vehicleId'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel className='gap-0' htmlFor='vehicle'>
                  Vehicle <RequiredMark />
                </FieldLabel>
                <VehicleSelect
                  id='vehicle'
                  vehicles={vehicles}
                  drivers={drivers}
                  value={field.value ?? ''}
                  emptyLabel='Assign later'
                  onChange={value => {
                    const vehicle = vehicles.find(v => v.id === value)

                    field.onChange(value)
                    setValue('driverId', vehicle?.assignedDriverId ?? '')
                    setValue('trackingDeviceId', vehicle?.gpsId ?? '')
                  }}
                />
                <FieldDescription>
                  Capacity and type decide the vehicle; its driver is filled in for you.
                </FieldDescription>
              </Field>
            )}
          />

          <Controller
            name='driverId'
            control={control}
            render={({ field }) => (
              <DriverField
                key={selectedVehicle?.id ?? 'none'}
                id='driver'
                drivers={drivers}
                vehicle={selectedVehicle}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name='carrier'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel className='gap-0' htmlFor='carrier'>
                  Carrier / team <RequiredMark />
                </FieldLabel>
                <Select items={CARRIER_OPTIONS} value={field.value || 'Internal Fleet'} onValueChange={field.onChange}>
                  <SelectTrigger id='carrier' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {CARRIER_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name='trackingDeviceId'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='tracking-device'>Tracking device</FieldLabel>
                <Input id='tracking-device' placeholder='GPS-#### or leave blank' {...field} />
                {selectedVehicle?.gpsId && field.value === selectedVehicle.gpsId && (
                  <FieldDescription>Fitted to {selectedVehicle.id}</FieldDescription>
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {selectedVehicle && (
          <div
            className={
              hasCapacity
                ? 'border-success bg-success-soft text-success rounded-xl border p-3 text-sm'
                : 'border-warning bg-warning-soft text-warning rounded-xl border p-3 text-sm'
            }
          >
            <div className='flex items-start gap-2'>
              <BadgeCheckIcon className='mt-0.5 size-4 shrink-0' />
              {hasCapacity ? (
                <p>
                  <span className='font-semibold'>Capacity check passed.</span> {selectedVehicle.id} carries up to{' '}
                  {getCapacityKg(selectedVehicle).toLocaleString()} kg and this order weighs{' '}
                  {totalWeightKg.toLocaleString()} kg.
                </p>
              ) : (
                <p>
                  <span className='font-semibold'>Selected vehicle may be under capacity.</span> {selectedVehicle.id}{' '}
                  carries up to {getCapacityKg(selectedVehicle).toLocaleString()} kg but this order weighs{' '}
                  {totalWeightKg.toLocaleString()} kg.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ResourcesSection
