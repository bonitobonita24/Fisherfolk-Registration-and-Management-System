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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Data Imports
import { REGION_OPTIONS } from '../vehicle-form-schema'
import { VEHICLE_STATUS_OPTIONS } from '../../vehicle-badges'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'
import AssignedDriverSelect from '@/components/shared/assigned-driver-select'

// Props
type AssignmentSectionProps = {
  control: Control<CreateVehicleFormInput>
  warehouses: Warehouse[]
  drivers: Driver[]
}

const AssignmentSection = ({ control, warehouses, drivers }: AssignmentSectionProps) => {
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
                <FieldLabel className='gap-0' htmlFor='vehicle-warehouse'>
                  Home Warehouse <RequiredMark />
                </FieldLabel>
                <Select items={warehouseItems} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='vehicle-warehouse' className='w-full'>
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
                id='vehicle-driver'
                drivers={drivers}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name='defaultRegion'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-region'>Default Region</FieldLabel>
                <Select items={REGION_OPTIONS} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='vehicle-region' className='w-full'>
                    <SelectValue placeholder='Select a region' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {REGION_OPTIONS.map(item => (
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
            name='operationalStatus'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='vehicle-operating-status'>
                  Operating Status <RequiredMark />
                </FieldLabel>
                <Select items={statusItems} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='vehicle-operating-status' className='w-full'>
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
