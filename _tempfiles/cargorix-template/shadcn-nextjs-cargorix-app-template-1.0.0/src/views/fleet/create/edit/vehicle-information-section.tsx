'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { LockIcon } from 'lucide-react'

// Type Imports
import type { CreateVehicleFormInput } from '../vehicle-form-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Data Imports
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
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-id'>Vehicle ID</FieldLabel>
                <InputGroup>
                  <InputGroupInput id='vehicle-id' disabled {...field} value={field.value ?? ''} />
                  <InputGroupAddon align='inline-end'>
                    <LockIcon className='size-4' />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            )}
          />

          <Controller
            name='registrationNo'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel className='gap-0' htmlFor='vehicle-registration'>
                  Registration Number <RequiredMark />
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput id='vehicle-registration' disabled {...field} value={field.value ?? ''} />
                  <InputGroupAddon align='inline-end'>
                    <LockIcon className='size-4' />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            )}
          />

          <Controller
            name='name'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-name'>Vehicle Name</FieldLabel>
                <Input id='vehicle-name' placeholder='e.g. Dallas Reefer 1' {...field} value={field.value ?? ''} />
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
                  Make <RequiredMark />
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
            name='vin'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-vin'>VIN / Chassis Number</FieldLabel>
                <Input id='vehicle-vin' placeholder='17-character VIN' {...field} value={field.value ?? ''} />
              </Field>
            )}
          />

          <Controller
            name='engineNo'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-engine'>Engine Number</FieldLabel>
                <Input id='vehicle-engine' placeholder='e.g. ENG-772014' {...field} value={field.value ?? ''} />
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default VehicleInformationSection
