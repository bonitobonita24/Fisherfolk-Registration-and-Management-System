'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'

// Type Imports
import type { CreateClientFormInput } from '../client-form-schema'

// Component Imports
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'

// Shared Imports
import ChipInput from '@/components/shared/chip-input'

// Data Imports
import { PREFERRED_SERVICES } from '../../client-badges'

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-')

// Props
type AdditionalInformationSectionProps = {
  control: Control<CreateClientFormInput>
  servicesAsChips?: boolean
}

const AdditionalInformationSection = ({ control, servicesAsChips }: AdditionalInformationSectionProps) => {
  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <h2 className='text-base font-semibold'>Additional information</h2>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Controller
          name='preferredServices'
          control={control}
          render={({ field }) => {
            const selected = field.value ?? []

            if (servicesAsChips) {
              return (
                <Field>
                  <FieldLabel htmlFor='client-preferred-services'>Preferred services</FieldLabel>
                  <ChipInput
                    id='client-preferred-services'
                    value={selected}
                    onChange={field.onChange}
                    placeholder='Add a service'
                    suggestions={PREFERRED_SERVICES}
                    aria-label='Preferred services'
                  />
                  <FieldDescription>Services this client is expected to use.</FieldDescription>
                </Field>
              )
            }

            return (
              <Field>
                <FieldLabel>Preferred services</FieldLabel>
                <div className='grid grid-cols-2 gap-3'>
                  {PREFERRED_SERVICES.map(service => (
                    <Field key={service} orientation='horizontal' className='items-center gap-2'>
                      <Checkbox
                        id={`client-service-${toSlug(service)}`}
                        checked={selected.includes(service)}
                        onCheckedChange={checked =>
                          field.onChange(
                            checked === true ? [...selected, service] : selected.filter(item => item !== service)
                          )
                        }
                      />
                      <FieldLabel htmlFor={`client-service-${toSlug(service)}`} className='font-normal'>
                        {service}
                      </FieldLabel>
                    </Field>
                  ))}
                </div>
                <FieldDescription>Services this client is expected to use.</FieldDescription>
              </Field>
            )
          }}
        />

        <Controller
          name='notes'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='client-notes'>Notes</FieldLabel>
              <Textarea
                id='client-notes'
                rows={8}
                placeholder='Delivery windows, dock access, escalation contacts…'
                value={field.value ?? ''}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={field.onChange}
              />
              <FieldDescription>Internal only — not visible to the client.</FieldDescription>
            </Field>
          )}
        />
      </div>
    </section>
  )
}

export default AdditionalInformationSection
