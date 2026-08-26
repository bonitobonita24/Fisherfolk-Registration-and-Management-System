'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { MapPinIcon } from 'lucide-react'

// Type Imports
import type { CreateSupplierFormInput } from '../supplier-form-schema'

// Component Imports
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Data Imports
import { COUNTRY_OPTIONS } from '../supplier-form-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type AddressSectionProps = {
  control: Control<CreateSupplierFormInput>
}

const AddressSection = ({ control }: AddressSectionProps) => {
  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <div className='flex items-center gap-3'>
        <span className='bg-accent text-accent-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
          <MapPinIcon className='size-4' />
        </span>
        <h2 className='text-base font-semibold'>Address</h2>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Controller
          name='addressLine1'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-address-line-1'>
                Address line 1 <RequiredMark />
              </FieldLabel>
              <Input
                id='supplier-address-line-1'
                placeholder='e.g., 742 Evergreen Terrace'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='addressLine2'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='supplier-address-line-2'>Address line 2</FieldLabel>
              <Input id='supplier-address-line-2' placeholder='e.g., Suite 400' {...field} value={field.value ?? ''} />
            </Field>
          )}
        />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Controller
          name='city'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-city'>
                City <RequiredMark />
              </FieldLabel>
              <Input
                id='supplier-city'
                placeholder='e.g., Springfield'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='state'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-state'>
                State / Region <RequiredMark />
              </FieldLabel>
              <Input
                id='supplier-state'
                placeholder='e.g., IL'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='postalCode'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-postal-code'>
                Postal code <RequiredMark />
              </FieldLabel>
              <Input
                id='supplier-postal-code'
                placeholder='e.g., 62704'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='country'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-country'>
                Country <RequiredMark />
              </FieldLabel>
              <Select items={COUNTRY_OPTIONS} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                <SelectTrigger
                  id='supplier-country'
                  className='w-full'
                  aria-label='Country'
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder='Select country' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {COUNTRY_OPTIONS.map(item => (
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
      </div>
    </section>
  )
}

export default AddressSection
