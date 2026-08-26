'use client'

// Third-party Imports
import { Controller, useWatch, type Control, type UseFormSetValue } from 'react-hook-form'

// Type Imports
import type { CreateRouteFormInput } from './route-form-schema'
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'
import DatePicker from '@/components/shared/date-picker'
import DriverField from '@/components/shared/driver-field'
import VehicleSelect from '@/components/shared/vehicle-select'

// Util Imports
import { todayDate } from '@/lib/date-bounds'

// Data Imports
import { NOTES_MAX_LENGTH } from './route-form-schema'

// Props
type AssignResourcesCardProps = {
  control: Control<CreateRouteFormInput>
  setValue: UseFormSetValue<CreateRouteFormInput>
  vehicles: Vehicle[]
  drivers: Driver[]
  warehouses: Warehouse[]
}

const AssignResourcesCard = ({ control, setValue, vehicles, drivers, warehouses }: AssignResourcesCardProps) => {
  // Hooks
  const notes = useWatch({ control, name: 'notes' })
  const vehicleId = useWatch({ control, name: 'vehicleId' })

  // Vars
  const warehouseItems = warehouses.map(warehouse => ({ label: warehouse.name, value: warehouse.id }))
  const selectedVehicle = vehicles.find(vehicle => vehicle.id === vehicleId)

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>Assign resources</CardTitle>
      </CardHeader>
      <CardContent className='p-4'>
        <FieldGroup className='grid grid-cols-1 gap-6'>
          <Controller
            name='startWarehouseId'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='route-warehouse'>
                  Start warehouse <RequiredMark />
                </FieldLabel>
                <Select items={warehouseItems} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='route-warehouse' className='w-full'>
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
            name='vehicleId'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='route-vehicle'>Vehicle</FieldLabel>
                <VehicleSelect
                  id='route-vehicle'
                  vehicles={vehicles}
                  drivers={drivers}
                  value={field.value ?? ''}
                  emptyLabel='Unassigned'
                  onChange={value => {
                    const vehicle = vehicles.find(v => v.id === value)

                    field.onChange(value)
                    setValue('driverId', vehicle?.assignedDriverId ?? '')
                  }}
                />
                <FieldDescription>Capacity and type decide the vehicle; its driver comes with it.</FieldDescription>
              </Field>
            )}
          />

          <Controller
            name='driverId'
            control={control}
            render={({ field }) => (
              <DriverField
                key={selectedVehicle?.id ?? 'none'}
                id='route-driver'
                drivers={drivers}
                vehicle={selectedVehicle}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name='date'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='route-date'>
                  Schedule date <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='route-date'
                  value={field.value}
                  onChange={field.onChange}
                  min={todayDate()}
                  invalid={fieldState.invalid}
                  placeholder='Select a date'
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='startTime'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='route-start-time'>
                  Start time <RequiredMark />
                </FieldLabel>
                <Input
                  id='route-start-time'
                  type='time'
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='returnToStart'
            control={control}
            render={({ field }) => (
              <Field orientation='horizontal' className='items-center justify-between'>
                <FieldLabel htmlFor='route-return-to-start'>Return to start</FieldLabel>
                <Switch
                  id='route-return-to-start'
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                  aria-label='Return to start warehouse'
                />
              </Field>
            )}
          />

          <Controller
            name='notes'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='route-notes'>Dispatch notes</FieldLabel>
                <Textarea
                  id='route-notes'
                  rows={3}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder='Anything the driver needs to know before departure'
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription className='tabular-nums'>
                  {(notes ?? '').length} / {NOTES_MAX_LENGTH}
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default AssignResourcesCard
