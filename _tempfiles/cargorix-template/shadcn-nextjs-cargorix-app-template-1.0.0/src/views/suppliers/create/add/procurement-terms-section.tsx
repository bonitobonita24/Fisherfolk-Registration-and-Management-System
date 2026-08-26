'use client'

// Third-party Imports
import { Controller, useWatch, type Control } from 'react-hook-form'
import { TagIcon } from 'lucide-react'

// Type Imports
import type { CreateSupplierFormInput } from '../supplier-form-schema'

// Component Imports
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Data Imports
import { CURRENCY_OPTIONS, INCOTERMS_SELECT_OPTIONS, PAYMENT_TERMS_SELECT_OPTIONS } from '../supplier-form-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type ProcurementTermsSectionProps = {
  control: Control<CreateSupplierFormInput>
}

const ProcurementTermsSection = ({ control }: ProcurementTermsSectionProps) => {
  // Hooks
  const currency = useWatch({ control, name: 'currency' })

  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <div className='flex items-center gap-3'>
        <span className='bg-accent text-accent-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
          <TagIcon className='size-4' />
        </span>
        <h2 className='text-base font-semibold'>Procurement &amp; Terms</h2>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Controller
          name='paymentTerms'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-payment-terms'>
                Payment terms <RequiredMark />
              </FieldLabel>
              <Select
                items={PAYMENT_TERMS_SELECT_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger
                  id='supplier-payment-terms'
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
              <FieldLabel className='gap-0' htmlFor='supplier-currency'>
                Currency <RequiredMark />
              </FieldLabel>
              <Select items={CURRENCY_OPTIONS} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                <SelectTrigger
                  id='supplier-currency'
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
          name='leadTimeDays'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-lead-time'>
                Lead time (days) <RequiredMark />
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id='supplier-lead-time'
                  type='number'
                  min={0}
                  placeholder='e.g., 7'
                  aria-invalid={fieldState.invalid}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value == null ? '' : String(field.value)}
                  onChange={event => field.onChange(event.target.value)}
                />
                <InputGroupAddon align='inline-end'>
                  <InputGroupText>days</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='minimumOrderValue'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-minimum-order-value'>
                Minimum order value <RequiredMark />
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{currency || 'USD'}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id='supplier-minimum-order-value'
                  type='number'
                  min={0}
                  placeholder='e.g., 2500'
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
          name='incoterms'
          control={control}
          render={({ field }) => (
            <Field className='md:col-span-2'>
              <FieldLabel htmlFor='supplier-incoterms'>Incoterms</FieldLabel>
              <Select
                items={INCOTERMS_SELECT_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger id='supplier-incoterms' className='w-full' aria-label='Incoterms'>
                  <SelectValue placeholder='Select incoterms' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {INCOTERMS_SELECT_OPTIONS.map(item => (
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
          name='priceValidityDays'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className='md:col-span-2'>
              <FieldLabel htmlFor='supplier-price-validity'>Price validity (days)</FieldLabel>
              <Input
                id='supplier-price-validity'
                type='number'
                min={0}
                placeholder='e.g., 60'
                aria-invalid={fieldState.invalid}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value == null ? '' : String(field.value)}
                onChange={event => field.onChange(event.target.value)}
              />
              <FieldDescription>How long a quoted price stays valid.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </section>
  )
}

export default ProcurementTermsSection
