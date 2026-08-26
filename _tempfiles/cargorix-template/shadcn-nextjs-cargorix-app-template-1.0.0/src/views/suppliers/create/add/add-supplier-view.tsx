'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { type Control } from 'react-hook-form'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { CreateSupplierFormInput } from '../supplier-form-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import AdditionalInformationSection from './additional-information-section'
import AddressSection from './address-section'
import DocumentsSection from './documents-section'
import PrimaryContactSection from './primary-contact-section'
import ProcurementTermsSection from './procurement-terms-section'
import SupplierInformationSection from './supplier-information-section'
import SupplierSummarySidebar from '../supplier-summary-sidebar'

// Props
type AddSupplierViewProps = {
  control: Control<CreateSupplierFormInput>
  purchaseOrders: PurchaseOrder[]
  onSaveDraft: () => void
  onAdd: () => void
}

const AddSupplierView = ({ control, purchaseOrders, onSaveDraft, onAdd }: AddSupplierViewProps) => {
  return (
    <div className='space-y-6'>
      <div className='text-muted-foreground flex items-center gap-1 text-sm'>
        <Button
          variant='link'
          size='sm'
          className='text-muted-foreground hover:text-foreground h-auto p-0'
          render={<Link href='/suppliers' />}
          nativeButton={false}
        >
          Suppliers
        </Button>
        <span aria-hidden='true'>/</span>
        <span className='text-foreground font-medium'>Add Supplier</span>
      </div>

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-3xl font-bold tracking-tight'>Add Supplier</h1>
          <p className='text-muted-foreground mt-1 text-sm'>Create a new supplier profile and procurement setup.</p>
        </div>
        <div className='flex shrink-0 flex-wrap gap-2'>
          <Button type='button' variant='outline' onClick={onSaveDraft}>
            Cancel
          </Button>
          <Button type='button' onClick={onAdd}>
            Create supplier
          </Button>
        </div>
      </div>

      <div className='relative grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='min-w-0 space-y-6'>
          <Card className='gap-0 py-0'>
            <SupplierInformationSection control={control} />
            <Separator />
            <PrimaryContactSection control={control} />
            <Separator />
            <AddressSection control={control} />
            <Separator />
            <ProcurementTermsSection control={control} />
            <Separator />
            <AdditionalInformationSection control={control} />
            <Separator />
            <DocumentsSection control={control} />
          </Card>
        </div>

        <aside className='min-w-0 xl:sticky xl:top-18 xl:self-start'>
          <SupplierSummarySidebar control={control} mode='add' purchaseOrders={purchaseOrders} />
        </aside>
      </div>
    </div>
  )
}

export default AddSupplierView
