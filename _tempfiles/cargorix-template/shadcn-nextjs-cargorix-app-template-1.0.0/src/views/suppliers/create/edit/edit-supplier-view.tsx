'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { type Control } from 'react-hook-form'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { Supplier } from '@/types/entities/supplier'
import type { CreateSupplierFormInput } from '../supplier-form-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import AdditionalInformationSection from '../add/additional-information-section'
import AddressSection from '../add/address-section'
import DocumentsSection from '../add/documents-section'
import PrimaryContactSection from '../add/primary-contact-section'
import ProcurementTermsSection from '../add/procurement-terms-section'
import SupplierInformationSection from '../add/supplier-information-section'
import SupplierSummarySidebar from '../supplier-summary-sidebar'

// Data Imports
import { PRODUCTS_SUPPLIED_SUGGESTIONS } from '../supplier-form-schema'

// Props
type EditSupplierViewProps = {
  control: Control<CreateSupplierFormInput>
  supplier: Supplier
  purchaseOrders: PurchaseOrder[]
  onSaveChanges: () => void
}

const EditSupplierView = ({ control, supplier, purchaseOrders, onSaveChanges }: EditSupplierViewProps) => {
  return (
    <div className='space-y-6'>
      <div className='text-muted-foreground flex flex-wrap items-center gap-1 text-sm'>
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
        <Button
          variant='link'
          size='sm'
          className='text-muted-foreground hover:text-foreground h-auto p-0'
          render={<Link href={`/suppliers/${supplier.id}`} />}
          nativeButton={false}
        >
          {supplier.name}
        </Button>
        <span aria-hidden='true'>/</span>
        <span className='text-foreground font-medium'>Edit</span>
      </div>

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-3xl font-bold tracking-tight'>Edit Supplier</h1>
          <p className='text-muted-foreground mt-1 text-sm'>Update supplier information and procurement preferences.</p>
        </div>
        <div className='flex shrink-0 flex-wrap gap-2'>
          <Button variant='outline' render={<Link href={`/suppliers/${supplier.id}`} />} nativeButton={false}>
            Cancel
          </Button>
          <Button type='button' onClick={onSaveChanges}>
            Save changes
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
            <AdditionalInformationSection control={control} suggestions={PRODUCTS_SUPPLIED_SUGGESTIONS} />
            <Separator />
            <DocumentsSection control={control} documents={supplier.documents} />
          </Card>
        </div>

        <aside className='min-w-0 xl:sticky xl:top-18 xl:self-start'>
          <SupplierSummarySidebar control={control} mode='edit' supplier={supplier} purchaseOrders={purchaseOrders} />
        </aside>
      </div>
    </div>
  )
}

export default EditSupplierView
