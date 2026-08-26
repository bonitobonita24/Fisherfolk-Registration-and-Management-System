'use client'

// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import { SaveIcon } from 'lucide-react'

// Type Imports
import type { Order } from '@/types/entities/order'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Data Imports
import { ORDER_STATUS_BADGE } from '../../order-badges'

type EditOrderViewProps = {
  order: Order
  sections: ReactNode
  sidebar: ReactNode
  onSaveChanges: () => void
  onCancel: () => void
}

const EditOrderView = ({ order, sections, sidebar, onSaveChanges, onCancel }: EditOrderViewProps) => {
  return (
    <>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-3xl font-bold tracking-tight'>Edit order {order.displayId}</h1>
            <Badge className={ORDER_STATUS_BADGE[order.status].className}>
              {ORDER_STATUS_BADGE[order.status].label}
            </Badge>
          </div>
          <p className='text-muted-foreground mt-1 text-sm'>
            Changes apply to this order only. Any shipment created from it keeps its own record.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='button' onClick={onSaveChanges}>
            <SaveIcon className='size-4' />
            Save changes
          </Button>
        </div>
      </div>

      <div className='relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]'>
        {sections}
        <aside className='lg:sticky lg:top-18 lg:self-start'>{sidebar}</aside>
      </div>
    </>
  )
}

export default EditOrderView
