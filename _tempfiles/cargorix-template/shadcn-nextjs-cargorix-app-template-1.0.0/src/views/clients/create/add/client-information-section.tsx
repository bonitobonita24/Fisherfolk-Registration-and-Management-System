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
import { ACCOUNT_MANAGER_OPTIONS, INDUSTRY_SELECT_OPTIONS, STATUS_SELECT_OPTIONS } from '../client-form-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type ClientInformationSectionProps = {
  control: Control<CreateClientFormInput>
}

const ClientInformationSection = ({ control }: ClientInformationSectionProps) => {
  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <h2 className='text-base font-semibold'>Client information</h2>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Controller
          name='name'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='client-name'>
                Client name <RequiredMark />
              </FieldLabel>
              <Input
                id='client-name'
                placeholder='e.g., Acme Retail Group'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='clientCode'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='client-code'>
                Client code <RequiredMark />
              </FieldLabel>
              <Input
                id='client-code'
                placeholder='e.g., ACME-1001'
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ''}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='legalName'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='client-legal-name'>Legal business name</FieldLabel>
              <Input
                id='client-legal-name'
                placeholder='e.g., Acme Retail Group LLC'
                {...field}
                value={field.value ?? ''}
              />
            </Field>
          )}
        />

        <Controller
          name='industry'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='client-industry'>Industry</FieldLabel>
              <Select
                items={INDUSTRY_SELECT_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger id='client-industry' className='w-full' aria-label='Industry'>
                  <SelectValue placeholder='Select industry' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {INDUSTRY_SELECT_OPTIONS.map(item => (
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
          name='status'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='client-status'>Status</FieldLabel>
              <Select
                items={STATUS_SELECT_OPTIONS}
                value={field.value ?? 'active'}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger id='client-status' className='w-full' aria-label='Status'>
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
            </Field>
          )}
        />

        <Controller
          name='accountManager'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='client-account-manager'>
                Account manager <RequiredMark />
              </FieldLabel>
              <Select
                items={ACCOUNT_MANAGER_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger
                  id='client-account-manager'
                  className='w-full'
                  aria-label='Account manager'
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder='Select account manager' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {ACCOUNT_MANAGER_OPTIONS.map(item => (
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

export default ClientInformationSection
