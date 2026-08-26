// Third-party Imports
import { Controller, type Control } from 'react-hook-form'

// Type Imports
import type { CreateOrderFormInput } from './create-order-schema'

// Component Imports
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OptionalHint } from './form-section'

// Data Imports
import { INTERNAL_NOTE_MAX_LENGTH } from './create-order-schema'

const ENTRY_REASON_OPTIONS = [
  { label: 'Customer placed order by phone', value: 'Customer placed order by phone' },
  { label: 'API or integration failed', value: 'API or integration failed' },
  { label: 'Email request', value: 'Email request' },
  { label: 'Urgent internal transfer', value: 'Urgent internal transfer' },
  { label: 'Replacement order', value: 'Replacement order' }
]

type ManualEntrySectionProps = {
  control: Control<CreateOrderFormInput>
}

const ManualEntrySection = ({ control }: ManualEntrySectionProps) => {
  return (
    <FieldGroup className='grid gap-6 sm:grid-cols-2'>
      <Controller
        name='entryReason'
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='entry-reason'>Entry reason</FieldLabel>
            <Select items={ENTRY_REASON_OPTIONS} value={field.value || ''} onValueChange={field.onChange}>
              <SelectTrigger id='entry-reason' className='w-full'>
                <SelectValue placeholder='Select a reason' />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
              >
                <SelectGroup>
                  {ENTRY_REASON_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Controller
        name='customerReference'
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='customer-reference'>
              Customer reference <OptionalHint />
            </FieldLabel>
            <Input id='customer-reference' placeholder='PO, email or call reference' {...field} />
          </Field>
        )}
      />

      <Controller
        name='internalNote'
        control={control}
        render={({ field, fieldState }) => (
          <Field className='sm:col-span-2' data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='internal-note'>
              Internal note <OptionalHint />
            </FieldLabel>
            <InputGroup>
              <InputGroupTextarea
                id='internal-note'
                rows={4}
                maxLength={INTERNAL_NOTE_MAX_LENGTH}
                placeholder='Explain the issue or source of the request'
                aria-invalid={fieldState.invalid}
                {...field}
              />
              <InputGroupAddon align='block-end' className='justify-end'>
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {(field.value ?? '').length}/{INTERNAL_NOTE_MAX_LENGTH}
                </span>
              </InputGroupAddon>
            </InputGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  )
}

export default ManualEntrySection
