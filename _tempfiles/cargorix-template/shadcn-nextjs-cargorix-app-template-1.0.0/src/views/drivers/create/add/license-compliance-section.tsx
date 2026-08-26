'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { ShieldIcon } from 'lucide-react'

// Type Imports
import type { Option } from '@/components/ui/multi-select'
import type { CreateDriverFormInput } from '../driver-form-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import MultipleSelector from '@/components/ui/multi-select'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'
import DatePicker from '@/components/shared/date-picker'

// Data Imports
import { ENDORSEMENT_SUGGESTIONS, LICENSE_CLASS_OPTIONS } from '../driver-form-schema'

// Props
type LicenseComplianceSectionProps = {
  control: Control<CreateDriverFormInput>
}

// Vars
const toOption = (value: string): Option => ({ value, label: value })
const ENDORSEMENT_OPTIONS = ENDORSEMENT_SUGGESTIONS.map(toOption)

const LicenseComplianceSection = ({ control }: LicenseComplianceSectionProps) => {
  return (
    <Card className='overflow-visible'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <ShieldIcon className='size-5' />
          License &amp; Compliance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Controller
            name='licenseNumber'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-license-number'>
                  License Number <RequiredMark />
                </FieldLabel>
                <Input
                  id='driver-license-number'
                  placeholder='e.g. CDL-A 8471203'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='licenseClass'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-license-class'>
                  License Class <RequiredMark />
                </FieldLabel>
                <Select
                  items={LICENSE_CLASS_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='driver-license-class' className='w-full'>
                    <SelectValue placeholder='Select a class' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {LICENSE_CLASS_OPTIONS.map(item => (
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
            name='licenseState'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-license-state'>
                  License State <RequiredMark />
                </FieldLabel>
                <Input
                  id='driver-license-state'
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
            name='licenseExpiry'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-license-expiry'>
                  License Expiry <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='driver-license-expiry'
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='endorsements'
            control={control}
            render={({ field }) => (
              <Field className='sm:col-span-2'>
                <FieldLabel>Endorsements</FieldLabel>
                <MultipleSelector
                  commandProps={{ label: 'Endorsements' }}
                  value={(field.value ?? []).map(toOption)}
                  defaultOptions={ENDORSEMENT_OPTIONS}
                  onChange={options => field.onChange(options.map(option => option.value))}
                  placeholder='Add an endorsement'
                  creatable
                  hidePlaceholderWhenSelected
                  emptyIndicator={<p className='text-center text-sm'>No results found</p>}
                />
              </Field>
            )}
          />

          <Controller
            name='medicalCardExpiry'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-medical-expiry'>
                  Medical Card Expiry <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='driver-medical-expiry'
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='drugTestDue'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='driver-drug-test-due'>Drug Test Due</FieldLabel>
                <DatePicker id='driver-drug-test-due' value={field.value} onChange={field.onChange} />
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default LicenseComplianceSection
