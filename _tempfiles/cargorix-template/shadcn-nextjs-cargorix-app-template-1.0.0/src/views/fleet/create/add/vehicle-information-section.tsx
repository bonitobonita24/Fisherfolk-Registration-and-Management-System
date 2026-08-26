'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'

// Type Imports
import type { CreateVehicleFormInput } from '../vehicle-form-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Data Imports
import { FUEL_TYPE_OPTIONS } from '../vehicle-form-schema'
import { VEHICLE_TYPE_OPTIONS } from '../../vehicle-badges'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type VehicleInformationSectionProps = {
  control: Control<CreateVehicleFormInput>
}

const VehicleInformationSection = ({ control }: VehicleInformationSectionProps) => {
  // Vars
  const typeItems = VEHICLE_TYPE_OPTIONS.filter(option => option.value !== 'all')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Information</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Controller
            name='vehicleId'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='vehicle-id'>
                  Vehicle ID <RequiredMark />
                </FieldLabel>
                <Input
                  id='vehicle-id'
                  placeholder='e.g. TRK-401'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='registrationNo'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='vehicle-registration'>
                  Registration Number <RequiredMark />
                </FieldLabel>
                <Input
                  id='vehicle-registration'
                  placeholder='e.g. TX-84021'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='type'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='vehicle-type'>
                  Vehicle Type <RequiredMark />
                </FieldLabel>
                <Select items={typeItems} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='vehicle-type' className='w-full'>
                    <SelectValue placeholder='Select a type' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {typeItems.map(item => (
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
            name='make'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='vehicle-make'>
                  Manufacturer <RequiredMark />
                </FieldLabel>
                <Input
                  id='vehicle-make'
                  placeholder='e.g. Freightliner'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='model'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='vehicle-model'>
                  Model <RequiredMark />
                </FieldLabel>
                <Input
                  id='vehicle-model'
                  placeholder='e.g. M2 106'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='year'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='vehicle-year'>
                  Year <RequiredMark />
                </FieldLabel>
                <Input
                  id='vehicle-year'
                  type='number'
                  min={1950}
                  placeholder='2024'
                  aria-invalid={fieldState.invalid}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value == null ? '' : String(field.value)}
                  onChange={event => field.onChange(event.target.value)}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='fuelType'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-fuel'>Fuel Type</FieldLabel>
                <Select
                  items={FUEL_TYPE_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='vehicle-fuel' className='w-full'>
                    <SelectValue placeholder='Select a fuel type' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {FUEL_TYPE_OPTIONS.map(item => (
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
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default VehicleInformationSection
