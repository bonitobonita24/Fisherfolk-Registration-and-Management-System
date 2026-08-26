'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'

// Type Imports
import type { CreateClientFormInput } from '../client-form-schema'

// Component Imports
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Data Imports
import { PREFERRED_CONTACT_OPTIONS } from '../client-form-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type PrimaryContactSectionProps = {
  control: Control<CreateClientFormInput>
  showExtended?: boolean
}

const PrimaryContactSection = ({ control, showExtended }: PrimaryContactSectionProps) => {
  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <h2 className='text-base font-semibold'>Primary contact</h2>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Controller
          name='contactName'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='client-contact-name'>
                Contact name <RequiredMark />
              </FieldLabel>
              <Input
                id='client-contact-name'
                placeholder='e.g., Bessie Cooper'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='contactJobTitle'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='client-contact-job-title'>Job title</FieldLabel>
              <Input
                id='client-contact-job-title'
                placeholder='e.g., Head of Supply Chain'
                {...field}
                value={field.value ?? ''}
              />
            </Field>
          )}
        />

        <Controller
          name='email'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='client-email'>
                Email <RequiredMark />
              </FieldLabel>
              <Input
                id='client-email'
                type='email'
                placeholder='name@company.com'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='phone'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='client-phone'>
                Phone <RequiredMark />
              </FieldLabel>
              <Input
                id='client-phone'
                placeholder='(212) 555-0147'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {showExtended && (
          <>
            <Controller
              name='contactMobile'
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='client-contact-mobile'>Mobile</FieldLabel>
                  <Input id='client-contact-mobile' placeholder='(212) 555-0891' {...field} value={field.value ?? ''} />
                </Field>
              )}
            />

            <Controller
              name='preferredContactMethod'
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='client-preferred-contact'>Preferred contact method</FieldLabel>
                  <Select
                    items={PREFERRED_CONTACT_OPTIONS}
                    value={field.value ?? ''}
                    onValueChange={value => field.onChange(value)}
                  >
                    <SelectTrigger
                      id='client-preferred-contact'
                      className='w-full'
                      aria-label='Preferred contact method'
                    >
                      <SelectValue placeholder='Select contact method' />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                    >
                      <SelectGroup>
                        {PREFERRED_CONTACT_OPTIONS.map(item => (
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
          </>
        )}
      </div>
    </section>
  )
}

export default PrimaryContactSection
