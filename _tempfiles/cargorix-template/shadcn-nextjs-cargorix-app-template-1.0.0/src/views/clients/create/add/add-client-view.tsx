'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { type Control } from 'react-hook-form'

// Type Imports
import type { CreateClientFormInput } from '../client-form-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import AdditionalInformationSection from './additional-information-section'
import AddressesSection from './addresses-section'
import BillingTermsSection from './billing-terms-section'
import ClientInformationSection from './client-information-section'
import DocumentsSection from './documents-section'
import PrimaryContactSection from './primary-contact-section'
import ClientSummarySidebar from '../client-summary-sidebar'

// Props
type AddClientViewProps = {
  control: Control<CreateClientFormInput>
  onSaveDraft: () => void
  onAdd: () => void
}

const AddClientView = ({ control, onSaveDraft, onAdd }: AddClientViewProps) => {
  return (
    <div className='space-y-6'>
      <div className='text-muted-foreground flex items-center gap-1 text-sm'>
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
        <span className='text-foreground font-medium'>Add Client</span>
      </div>

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-3xl font-bold tracking-tight'>Add Client</h1>
          <p className='text-muted-foreground mt-1 text-sm'>Create a new client account and billing profile.</p>
        </div>
        <div className='flex shrink-0 flex-wrap gap-2'>
          <Button type='button' variant='outline' onClick={onSaveDraft}>
            Cancel
          </Button>
          <Button type='button' onClick={onAdd}>
            Create client
          </Button>
        </div>
      </div>

      <div className='relative grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='min-w-0 space-y-6'>
          <Card className='gap-0 divide-y py-0'>
            <ClientInformationSection control={control} />
            <PrimaryContactSection control={control} />
            <AddressesSection control={control} />
            <BillingTermsSection control={control} />
            <AdditionalInformationSection control={control} />
            <DocumentsSection />
          </Card>
        </div>

        <aside className='min-w-0 xl:sticky xl:top-18 xl:self-start'>
          <ClientSummarySidebar control={control} mode='add' />
        </aside>
      </div>
    </div>
  )
}

export default AddClientView
