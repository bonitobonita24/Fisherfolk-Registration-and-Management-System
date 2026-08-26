'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { PlusIcon, UploadIcon } from 'lucide-react'
import { toast } from 'sonner'

// Component Imports
import { Button } from '@/components/ui/button'

const ShipmentsPageHeader = () => {
  return (
    <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Shipments</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Plan, assign and track the physical movement created from customer orders.
        </p>
      </div>
      <div className='flex flex-wrap gap-2'>
        <Button variant='secondary' className='gap-2' onClick={() => toast('Exporting shipments')}>
          <UploadIcon data-icon='inline-start' />
          Export
        </Button>
        <Button className='gap-2' render={<Link href='/orders' />} nativeButton={false}>
          <PlusIcon data-icon='inline-start' />
          Create shipment
        </Button>
      </div>
    </div>
  )
}

export default ShipmentsPageHeader
