'use client'

// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import { ArrowRightIcon, FileTextIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

type AddOrderViewProps = {
  sections: ReactNode
  sidebar: ReactNode
  onSaveDraft: () => void
  onCreate: () => void
}

const AddOrderView = ({ sections, sidebar, onSaveDraft, onCreate }: AddOrderViewProps) => {
  return (
    <>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Create order</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Capture the client request. Driver and vehicle assignment happens after shipment creation.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button type='button' variant='outline' onClick={onSaveDraft}>
            <FileTextIcon className='size-4' />
            Save as draft
          </Button>
          <Button type='button' onClick={onCreate}>
            Create &amp; review
            <ArrowRightIcon className='size-4' />
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

export default AddOrderView
