'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { Building2Icon } from 'lucide-react'

// Type Imports
import type { CreateSupplierFormInput } from '../supplier-form-schema'

// Component Imports
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// Data Imports
import { ACCOUNT_OWNER_OPTIONS, CATEGORY_SELECT_OPTIONS, STATUS_SELECT_OPTIONS } from '../supplier-form-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type SupplierInformationSectionProps = {
  control: Control<CreateSupplierFormInput>
}

const SupplierInformationSection = ({ control }: SupplierInformationSectionProps) => {
  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <div className='flex items-center gap-3'>
        <span className='bg-accent text-accent-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
          <Building2Icon className='size-4' />
        </span>
        <h2 className='text-base font-semibold'>Supplier Information</h2>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Controller
          name='name'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-name'>
                Supplier name <RequiredMark />
              </FieldLabel>
              <Input
                id='supplier-name'
                placeholder='e.g., Pacific Imports'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='supplierCode'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-code'>
                Supplier code <RequiredMark />
              </FieldLabel>
              <Input
                id='supplier-code'
                placeholder='e.g., SUP-1001'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='category'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-category'>
                Category <RequiredMark />
              </FieldLabel>
              <Select
                items={CATEGORY_SELECT_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger
                  id='supplier-category'
                  className='w-full'
                  aria-label='Category'
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {CATEGORY_SELECT_OPTIONS.map(item => (
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
          name='status'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='supplier-status'>
                Status <RequiredMark />
              </FieldLabel>
              <Select
                items={STATUS_SELECT_OPTIONS}
                value={field.value ?? 'active'}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger
                  id='supplier-status'
                  className='w-full'
                  aria-label='Status'
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {STATUS_SELECT_OPTIONS.map(item => (
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
          name='accountOwner'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='supplier-account-owner'>Account owner</FieldLabel>
              <Select
                items={ACCOUNT_OWNER_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger id='supplier-account-owner' className='w-full' aria-label='Account owner'>
                  <SelectValue placeholder='Select account owner' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {ACCOUNT_OWNER_OPTIONS.map(item => (
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
          name='description'
          control={control}
          render={({ field }) => (
            <Field className='md:col-span-3'>
              <FieldLabel htmlFor='supplier-description'>Description</FieldLabel>
              <Textarea
                id='supplier-description'
                rows={2}
                placeholder='e.g., Primary consumer electronics distributor covering accessories and networking gear.'
                value={field.value ?? ''}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={field.onChange}
              />
              <FieldDescription>Shown as the subtitle on the supplier profile.</FieldDescription>
            </Field>
          )}
        />
      </div>
    </section>
  )
}

export default SupplierInformationSection
