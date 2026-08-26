'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { UserRoundIcon } from 'lucide-react'

// Type Imports
import type { CreateSupplierFormInput } from '../supplier-form-schema'

// Component Imports
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type PrimaryContactSectionProps = {
  control: Control<CreateSupplierFormInput>
}

const PrimaryContactSection = ({ control }: PrimaryContactSectionProps) => {
  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <div className='flex items-center gap-3'>
        <span className='bg-accent text-accent-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
          <UserRoundIcon className='size-4' />
        </span>
        <h2 className='text-base font-semibold'>Primary Contact</h2>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Controller
          name='contactPerson'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-contact-person'>
                Contact person <RequiredMark />
              </FieldLabel>
              <Input
                id='supplier-contact-person'
                placeholder='e.g., John Anderson'
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
              <FieldLabel className='gap-0' htmlFor='supplier-email'>
                Email <RequiredMark />
              </FieldLabel>
              <Input
                id='supplier-email'
                type='email'
                placeholder='e.g., name@supplier.com'
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
              <FieldLabel className='gap-0' htmlFor='supplier-phone'>
                Phone <RequiredMark />
              </FieldLabel>
              <Input
                id='supplier-phone'
                placeholder='e.g., +1 (312) 555-0189'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </section>
  )
}

export default PrimaryContactSection
