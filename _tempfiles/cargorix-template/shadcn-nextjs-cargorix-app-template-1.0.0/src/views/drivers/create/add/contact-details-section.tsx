'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { PhoneIcon } from 'lucide-react'

// Type Imports
import type { CreateDriverFormInput } from '../driver-form-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type ContactDetailsSectionProps = {
  control: Control<CreateDriverFormInput>
}

const ContactDetailsSection = ({ control }: ContactDetailsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <PhoneIcon className='size-5' />
          Contact Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Controller
            name='phone'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-phone'>
                  Phone <RequiredMark />
                </FieldLabel>
                <Input
                  id='driver-phone'
                  placeholder='e.g. +1 (202) 555-0184'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='email'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-email'>
                  Email <RequiredMark />
                </FieldLabel>
                <Input
                  id='driver-email'
                  type='email'
                  placeholder='e.g. eddie.wang@cargorix.com'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='address'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className='sm:col-span-2'>
                <FieldLabel className='gap-0' htmlFor='driver-address'>
                  Address <RequiredMark />
                </FieldLabel>
                <Textarea
                  id='driver-address'
                  placeholder='e.g. 1420 W Camelback Rd'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='city'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-city'>
                  City <RequiredMark />
                </FieldLabel>
                <Input
                  id='driver-city'
                  placeholder='e.g. Phoenix'
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
                <FieldLabel className='gap-0' htmlFor='driver-state'>
                  State <RequiredMark />
                </FieldLabel>
                <Input
                  id='driver-state'
                  placeholder='e.g. Arizona'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='zip'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='driver-zip'>ZIP</FieldLabel>
                <Input id='driver-zip' placeholder='e.g. 85013' {...field} value={field.value ?? ''} />
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default ContactDetailsSection
