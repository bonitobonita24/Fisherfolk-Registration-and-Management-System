'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'

// Type Imports
import type { CreateVehicleFormInput } from '../vehicle-form-schema'
import type { Driver } from '@/types/entities/driver'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Data Imports
import { OPERATING_ZONE_OPTIONS, ROUTE_TYPE_OPTIONS } from '../vehicle-form-schema'
import { VEHICLE_STATUS_OPTIONS } from '../../vehicle-badges'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'
import AssignedDriverSelect from '@/components/shared/assigned-driver-select'

// Props
type AssignmentSectionProps = {
  control: Control<CreateVehicleFormInput>
  warehouses: Warehouse[]
  drivers: Driver[]
  vehicleId?: string
}

const AssignmentSection = ({ control, warehouses, drivers, vehicleId }: AssignmentSectionProps) => {
  // Vars
  const warehouseItems = warehouses.map(warehouse => ({ label: warehouse.name, value: warehouse.id }))
  const statusItems = VEHICLE_STATUS_OPTIONS.filter(option => option.value !== 'all')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Controller
            name='homeWarehouseId'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='vehicle-home-base'>
                  Home Base <RequiredMark />
                </FieldLabel>
                <Select items={warehouseItems} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='vehicle-home-base' className='w-full'>
                    <SelectValue placeholder='Select a warehouse' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {warehouseItems.map(item => (
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
            name='assignedDriverId'
            control={control}
            render={({ field }) => (
              <AssignedDriverSelect
                id='vehicle-primary-driver'
                drivers={drivers}
                value={field.value ?? ''}
                onChange={field.onChange}
                vehicleId={vehicleId}
              />
            )}
          />

          <Controller
            name='operatingZone'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-zone'>Operating Zone</FieldLabel>
                <Select
                  items={OPERATING_ZONE_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='vehicle-zone' className='w-full'>
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
            name='defaultRouteType'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-route-type'>Default Route Type</FieldLabel>
                <Select
                  items={ROUTE_TYPE_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='vehicle-route-type' className='w-full'>
                    <SelectValue placeholder='Select a route type' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {ROUTE_TYPE_OPTIONS.map(item => (
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
            name='workingHours'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-working-hours'>Working Hours</FieldLabel>
                <Input
                  id='vehicle-working-hours'
                  placeholder='e.g. 06:00 - 18:00'
                  {...field}
                  value={field.value ?? ''}
                />
              </Field>
            )}
          />

          <Controller
            name='operationalStatus'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='vehicle-status'>
                  Status <RequiredMark />
                </FieldLabel>
                <Select items={statusItems} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='vehicle-status' className='w-full'>
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
