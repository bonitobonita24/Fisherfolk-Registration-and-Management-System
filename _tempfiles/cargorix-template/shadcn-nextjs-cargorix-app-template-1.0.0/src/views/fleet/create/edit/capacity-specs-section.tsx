'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'

// Type Imports
import type { CreateVehicleFormInput } from '../vehicle-form-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Data Imports
import { EMISSION_STANDARD_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS } from '../vehicle-form-schema'

// Props
type CapacitySpecsSectionProps = {
  control: Control<CreateVehicleFormInput>
}

const CapacitySpecsSection = ({ control }: CapacitySpecsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity &amp; Specifications</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Controller
            name='capacityKg'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-capacity'>Payload Capacity (kg)</FieldLabel>
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
            name='transmission'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-transmission'>Transmission</FieldLabel>
                <Select
                  items={TRANSMISSION_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='vehicle-transmission' className='w-full'>
                    <SelectValue placeholder='Select transmission' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {TRANSMISSION_OPTIONS.map(item => (
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
            name='emissionStandard'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-emission'>Emission Standard</FieldLabel>
                <Select
                  items={EMISSION_STANDARD_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='vehicle-emission' className='w-full'>
                    <SelectValue placeholder='Select a standard' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {EMISSION_STANDARD_OPTIONS.map(item => (
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
            name='dimensions'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-dimensions'>Vehicle Dimensions (mm)</FieldLabel>
                <Input id='vehicle-dimensions' placeholder='L x W x H' {...field} value={field.value ?? ''} />
              </Field>
            )}
          />

          <Controller
            name='odometerKm'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-odometer'>Odometer Reading (km)</FieldLabel>
                <Input
                  id='vehicle-odometer'
                  type='number'
                  min={0}
                  placeholder='84000'
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
            name='seatingCapacity'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-seating'>Seating Capacity</FieldLabel>
                <Input
                  id='vehicle-seating'
                  type='number'
                  min={0}
                  placeholder='2'
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
            name='axleConfig'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-axle'>Axle Configuration</FieldLabel>
                <Input id='vehicle-axle' placeholder='e.g. 6x4' {...field} value={field.value ?? ''} />
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default CapacitySpecsSection
