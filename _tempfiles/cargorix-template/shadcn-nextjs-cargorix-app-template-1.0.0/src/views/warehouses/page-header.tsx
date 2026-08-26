'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { PlusIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

const WarehousesPageHeader = () => {
  // Hooks
  const router = useRouter()

  const handleAddWarehouse = () => {
    router.push(`/warehouses/create/${crypto.randomUUID()}`)
  }

  return (
    <div className='flex justify-between gap-4 max-sm:flex-col sm:items-center'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Warehouses</h1>
        <p className='text-muted-foreground mt-1 text-sm'>Manage warehouse locations, capacity and operations.</p>
      </div>
      <Button className='gap-2' onClick={handleAddWarehouse}>
        <PlusIcon className='size-4' />
        Add warehouse
      </Button>
    </div>
  )
}

export default WarehousesPageHeader
