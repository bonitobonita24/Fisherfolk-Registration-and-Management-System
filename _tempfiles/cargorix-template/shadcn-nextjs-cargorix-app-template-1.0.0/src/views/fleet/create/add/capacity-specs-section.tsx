'use client'

// Third-party Imports
import { Controller, useWatch, type Control } from 'react-hook-form'

// Type Imports
import type { CreateVehicleFormInput } from '../vehicle-form-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

// Props
type CapacitySpecsSectionProps = {
  control: Control<CreateVehicleFormInput>
}

const CapacitySpecsSection = ({ control }: CapacitySpecsSectionProps) => {
  // Hooks
  const refrigerated = useWatch({ control, name: 'refrigerated' })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity &amp; Specifications</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Controller
            name='capacityKg'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-capacity'>Maximum Weight (kg)</FieldLabel>
                <Input
                  id='vehicle-capacity'
                  type='number'
                  min={0}
                  placeholder='3500'
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value == null ? '' : String(field.value)}
                  onChange={event => field.onChange(event.target.value)}
                />
              </Field>
            )}
          />

          <Controller
            name='cargoVolumeM3'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-volume'>Cargo Volume (m³)</FieldLabel>
                <Input
                  id='vehicle-volume'
                  type='number'
                  min={0}
                  placeholder='18'
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value == null ? '' : String(field.value)}
                  onChange={event => field.onChange(event.target.value)}
                />
              </Field>
            )}
          />

          <Controller
            name='palletCapacity'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-pallets'>Pallet Capacity</FieldLabel>
                <Input
                  id='vehicle-pallets'
                  type='number'
                  min={0}
                  placeholder='12'
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value == null ? '' : String(field.value)}
                  onChange={event => field.onChange(event.target.value)}
                />
              </Field>
            )}
          />

          <Controller
            name='fuelTankCapacityL'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-tank'>Fuel Tank Capacity (L)</FieldLabel>
                <Input
                  id='vehicle-tank'
                  type='number'
                  min={0}
                  placeholder='150'
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value == null ? '' : String(field.value)}
                  onChange={event => field.onChange(event.target.value)}
                />
              </Field>
            )}
          />

          <Controller
            name='tempRangeC'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-temp'>Temperature Range (°C)</FieldLabel>
                <Input
                  id='vehicle-temp'
                  placeholder='-20 to 8'
                  disabled={!refrigerated}
                  {...field}
                  value={field.value ?? ''}
                />
              </Field>
            )}
          />
        </div>

        <Controller
          name='refrigerated'
          control={control}
          render={({ field }) => (
            <Field orientation='horizontal' className='rounded-md border p-4'>
              <div className='flex-1 space-y-1'>
                <FieldLabel htmlFor='vehicle-refrigerated'>Refrigerated</FieldLabel>
                <FieldDescription>Enable temperature-controlled cargo for this vehicle.</FieldDescription>
              </div>
              <Switch id='vehicle-refrigerated' checked={Boolean(field.value)} onCheckedChange={field.onChange} />
            </Field>
          )}
        />
      </CardContent>
    </Card>
  )
}

export default CapacitySpecsSection
