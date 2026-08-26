'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { PencilIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { CreateClientFormInput } from '../client-form-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import AdditionalInformationSection from '../add/additional-information-section'
import BillingTermsSection from '../add/billing-terms-section'
import ClientInformationSection from '../add/client-information-section'
import DocumentsSection from '../add/documents-section'
import PrimaryContactSection from '../add/primary-contact-section'
import ClientSummarySidebar from '../client-summary-sidebar'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Vars
const ADDRESS_PLACEHOLDER = 'No address on file.'

// Props
type AddressCardProps = {
  control: Control<CreateClientFormInput>
  name: 'billingAddress' | 'shippingAddress'
  label: string
  isEditing: boolean
  onToggle: () => void

  required?: boolean
}

const AddressCard = ({ control, name, label, isEditing, onToggle, required }: AddressCardProps) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState }) => (
      <div className='rounded-md border p-4'>
        <div className='flex items-start justify-between gap-3'>
          <p className='font-medium'>
            {label}
            {required && <RequiredMark />}
          </p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='shrink-0 gap-1.5'
            onClick={onToggle}
            aria-label={`${isEditing ? 'Done editing' : 'Edit'} ${label.toLowerCase()}`}
          >
            <PencilIcon className='size-3.5' />
            {isEditing ? 'Done' : 'Edit'}
          </Button>
        </div>

        {isEditing ? (
          <Field data-invalid={fieldState.invalid} className='mt-3'>
            <FieldLabel htmlFor={`client-edit-${name}`} className='sr-only'>
              {label}
            </FieldLabel>
            <Textarea
              id={`client-edit-${name}`}
              rows={4}
              aria-invalid={fieldState.invalid}
              value={field.value ?? ''}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              onChange={field.onChange}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        ) : (
          <p className='text-muted-foreground mt-3 text-sm whitespace-pre-line'>{field.value || ADDRESS_PLACEHOLDER}</p>
        )}
      </div>
    )}
  />
)

// Props
type EditClientViewProps = {
  control: Control<CreateClientFormInput>
  client: Client
  onSaveChanges: () => void
}

const EditClientView = ({ control, client, onSaveChanges }: EditClientViewProps) => {
  // States
  const [editingBilling, setEditingBilling] = useState(false)
  const [editingShipping, setEditingShipping] = useState(false)

  return (
    <div className='space-y-6'>
      <div className='text-muted-foreground flex flex-wrap items-center gap-1 text-sm'>
        <Button
          variant='link'
          size='sm'
          className='text-muted-foreground hover:text-foreground h-auto p-0'
          render={<Link href='/clients' />}
          nativeButton={false}
        >
          Clients
        </Button>
        <span aria-hidden='true'>/</span>
        <Button
          variant='link'
          size='sm'
          className='text-muted-foreground hover:text-foreground h-auto p-0'
          render={<Link href={`/clients/${client.id}`} />}
          nativeButton={false}
        >
          {client.name}
        </Button>
        <span aria-hidden='true'>/</span>
        <span className='text-foreground font-medium'>Edit</span>
      </div>

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-3xl font-bold tracking-tight'>Edit Client</h1>
          <p className='text-muted-foreground mt-1 text-sm'>Update client information and billing preferences.</p>
        </div>
        <div className='flex shrink-0 flex-wrap gap-2'>
          <Button variant='outline' render={<Link href={`/clients/${client.id}`} />} nativeButton={false}>
            Cancel
          </Button>
          <Button type='button' onClick={onSaveChanges}>
            Save changes
          </Button>
        </div>
      </div>

      <div className='relative grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='min-w-0 space-y-6'>
          <Card className='gap-0 divide-y py-0'>
            <ClientInformationSection control={control} />
            <PrimaryContactSection control={control} showExtended />

            <section className='space-y-6 p-4 sm:p-6'>
              <h2 className='text-base font-semibold'>Addresses</h2>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <AddressCard
                  control={control}
                  name='billingAddress'
                  label='Billing address'
                  required
                  isEditing={editingBilling}
                  onToggle={() => setEditingBilling(prev => !prev)}
                />
                <AddressCard
                  control={control}
                  name='shippingAddress'
                  label='Shipping address'
                  isEditing={editingShipping}
                  onToggle={() => setEditingShipping(prev => !prev)}
                />
              </div>
            </section>

            <BillingTermsSection control={control} />
            <AdditionalInformationSection control={control} servicesAsChips />
            <DocumentsSection documents={client.documents} />
          </Card>
        </div>

        <aside className='min-w-0 xl:sticky xl:top-18 xl:self-start'>
          <ClientSummarySidebar control={control} mode='edit' client={client} />
        </aside>
      </div>
    </div>
  )
}

export default EditClientView
