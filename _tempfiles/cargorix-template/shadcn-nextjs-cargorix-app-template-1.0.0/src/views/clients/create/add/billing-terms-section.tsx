'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'

// Type Imports
import type { CreateClientFormInput } from '../client-form-schema'

// Component Imports
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Data Imports
import { CURRENCY_OPTIONS, PAYMENT_TERMS_SELECT_OPTIONS } from '../client-form-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type BillingTermsSectionProps = {
  control: Control<CreateClientFormInput>
}

const BillingTermsSection = ({ control }: BillingTermsSectionProps) => {
  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <h2 className='text-base font-semibold'>Billing &amp; terms</h2>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Controller
          name='paymentTerms'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='client-payment-terms'>
                Payment terms <RequiredMark />
              </FieldLabel>
              <Select
                items={PAYMENT_TERMS_SELECT_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger
                  id='client-payment-terms'
                  className='w-full'
                  aria-label='Payment terms'
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder='Select payment terms' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {PAYMENT_TERMS_SELECT_OPTIONS.map(item => (
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
          name='currency'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='client-currency'>
                Currency <RequiredMark />
              </FieldLabel>
              <Select items={CURRENCY_OPTIONS} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                <SelectTrigger
                  id='client-currency'
                  className='w-full'
                  aria-label='Currency'
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder='Select currency' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {CURRENCY_OPTIONS.map(item => (
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
          name='creditLimit'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='client-credit-limit'>Credit limit</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id='client-credit-limit'
                  type='number'
                  min={0}
                  placeholder='e.g., 250000'
                  aria-invalid={fieldState.invalid}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value == null ? '' : String(field.value)}
                  onChange={event => field.onChange(event.target.value)}
                />
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='billingEmail'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='client-billing-email'>
                Billing email <RequiredMark />
              </FieldLabel>
              <Input
                id='client-billing-email'
                type='email'
                placeholder='ap@company.com'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='taxId'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='client-tax-id'>Tax ID</FieldLabel>
              <Input id='client-tax-id' placeholder='e.g., 12-3456789' {...field} value={field.value ?? ''} />
            </Field>
          )}
        />
      </div>
    </section>
  )
}

export default BillingTermsSection
