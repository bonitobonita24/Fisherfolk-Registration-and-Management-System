'use client'

// Third-party Imports
import { Controller, useWatch, type Control } from 'react-hook-form'

// Type Imports
import type { CreateClientFormInput } from '../client-form-schema'

// Component Imports
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Vars
const ADDRESS_HINT = 'Street, city, state / province, ZIP / postal code, country'

// Props
type AddressesSectionProps = {
  control: Control<CreateClientFormInput>
}

const AddressesSection = ({ control }: AddressesSectionProps) => {
  // Hooks
  const [billingAddress, sameAsBilling] = useWatch({ control, name: ['billingAddress', 'sameAsBilling'] })

  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <h2 className='text-base font-semibold'>Addresses</h2>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Controller
          name='billingAddress'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='client-billing-address'>
                Billing address <RequiredMark />
              </FieldLabel>
              <Textarea
                id='client-billing-address'
                rows={4}
                placeholder={'e.g., 1120 Sixth Avenue, Suite 400\nNew York, NY 10018\nUnited States'}
                aria-invalid={fieldState.invalid}
                value={field.value ?? ''}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={field.onChange}
              />
              <FieldDescription>{ADDRESS_HINT}</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='shippingAddress'
          control={control}
          render={({ field: shippingField }) => (
            <div className='space-y-3'>
              <Field>
                <FieldLabel htmlFor='client-shipping-address'>Shipping address</FieldLabel>
                <Textarea
                  id='client-shipping-address'
                  rows={4}
                  placeholder={'e.g., 88 Wythe Avenue, Dock 3\nBrooklyn, NY 11249\nUnited States'}
                  disabled={Boolean(sameAsBilling)}
                  value={(sameAsBilling ? billingAddress : shippingField.value) ?? ''}
                  name={shippingField.name}
                  ref={shippingField.ref}
                  onBlur={shippingField.onBlur}
                  onChange={shippingField.onChange}
                />
                <FieldDescription>{ADDRESS_HINT}</FieldDescription>
              </Field>

              <Controller
                name='sameAsBilling'
                control={control}
                render={({ field: sameField }) => (
                  <Field orientation='horizontal' className='items-center gap-2'>
                    <Checkbox
                      id='client-same-as-billing'
                      checked={Boolean(sameField.value)}
                      onCheckedChange={checked => {
                        const next = checked === true

                        sameField.onChange(next)
                        if (next) shippingField.onChange(billingAddress ?? '')
                      }}
                    />
                    <FieldLabel htmlFor='client-same-as-billing' className='font-normal'>
                      Shipping address is the same as billing address
                    </FieldLabel>
                  </Field>
                )}
              />
            </div>
          )}
        />
      </div>
    </section>
  )
}

export default AddressesSection
