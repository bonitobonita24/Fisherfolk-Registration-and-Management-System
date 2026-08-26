// Third-party Imports
import { Controller, type Control, type UseFormSetValue } from 'react-hook-form'

// Type Imports
import type { CreateOrderFormInput } from './create-order-schema'
import type { Client } from '@/types/entities/client'

// Component Imports
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OptionalHint } from './form-section'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

type ClientBillingSectionProps = {
  control: Control<CreateOrderFormInput>
  setValue: UseFormSetValue<CreateOrderFormInput>
  clients: Client[]
}

const ClientBillingSection = ({ control, setValue, clients }: ClientBillingSectionProps) => {
  // Vars
  const clientItems = clients.map(c => ({ label: `${c.name} — ${c.industry}`, value: c.id }))

  const handleClientChange = (clientId: string | null) => {
    if (!clientId) return

    const client = clients.find(c => c.id === clientId)

    if (!client) return

    setValue('contactName', client.contactName)
    setValue('contactEmail', client.email)
    setValue('contactPhone', client.phone)
    setValue('billingAccount', client.billingAccount)
  }

  return (
    <FieldGroup className='grid gap-6 sm:grid-cols-2'>
      <Controller
        name='clientId'
        control={control}
        render={({ field, fieldState }) => (
          <Field className='sm:col-span-2' data-invalid={fieldState.invalid}>
            <FieldLabel className='gap-0' htmlFor='client-account'>
              Client account <RequiredMark />
            </FieldLabel>
            <Select
              items={clientItems}
              value={field.value || ''}
              onValueChange={value => {
                field.onChange(value)
                handleClientChange(value)
              }}
            >
              <SelectTrigger id='client-account' className='w-full' aria-invalid={fieldState.invalid}>
                <SelectValue placeholder='Select a client' />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
              >
                <SelectGroup>
                  {clientItems.map(item => (
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
        name='contactName'
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='contact-name'>Contact person</FieldLabel>
            <Input id='contact-name' placeholder='Full name' {...field} />
          </Field>
        )}
      />

      <Controller
        name='contactEmail'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='contact-email'>Email</FieldLabel>
            <Input
              id='contact-email'
              type='email'
              placeholder='name@example.com'
              aria-invalid={fieldState.invalid}
              {...field}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name='contactPhone'
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='contact-phone'>Phone</FieldLabel>
            <Input id='contact-phone' placeholder='e.g. +1 555 123 4567' {...field} />
          </Field>
        )}
      />

      <Controller
        name='billingAccount'
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor='billing-account'>
              Billing account <OptionalHint />
            </FieldLabel>
            <Input id='billing-account' placeholder='Select or enter account' {...field} />
          </Field>
        )}
      />
    </FieldGroup>
  )
}

export default ClientBillingSection
