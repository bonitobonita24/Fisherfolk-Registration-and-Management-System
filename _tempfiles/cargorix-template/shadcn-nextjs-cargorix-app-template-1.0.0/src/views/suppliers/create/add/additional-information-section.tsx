'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { FileTextIcon } from 'lucide-react'

// Type Imports
import type { CreateSupplierFormInput } from '../supplier-form-schema'

// Component Imports
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'

// Shared Imports
import ChipInput from '@/components/shared/chip-input'

// Props
type AdditionalInformationSectionProps = {
  control: Control<CreateSupplierFormInput>

  suggestions?: string[]
}

const AdditionalInformationSection = ({ control, suggestions }: AdditionalInformationSectionProps) => {
  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <div className='flex items-center gap-3'>
        <span className='bg-accent text-accent-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
          <FileTextIcon className='size-4' />
        </span>
        <h2 className='text-base font-semibold'>Additional Information</h2>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Controller
          name='productsSupplied'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='supplier-products-supplied'>Products supplied</FieldLabel>
              <ChipInput
                id='supplier-products-supplied'
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder='Add product / service'
                suggestions={suggestions}
                aria-label='Products supplied'
              />
              <FieldDescription>Categories this supplier can fulfil.</FieldDescription>
            </Field>
          )}
        />

        <Controller
          name='notes'
          control={control}
          render={({ field }) => (
            <Field className='md:col-span-2'>
              <FieldLabel htmlFor='supplier-notes'>Notes</FieldLabel>
              <Textarea
                id='supplier-notes'
                rows={6}
                placeholder='e.g., Lead times stretch during peak season — confirm allocation before quarter end.'
                value={field.value ?? ''}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={field.onChange}
              />
              <FieldDescription>Internal only — not visible to the supplier.</FieldDescription>
            </Field>
          )}
        />
      </div>
    </section>
  )
}

export default AdditionalInformationSection
