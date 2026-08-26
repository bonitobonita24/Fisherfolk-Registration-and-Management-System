'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { PlusIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'

const DriversHeader = () => {
  // Hooks
  const router = useRouter()

  const handleAddDriver = () => {
    const id = crypto.randomUUID()

    useDriversStore.getState().createDraftDriver(id)
    router.push(`/drivers/create/${id}`)
  }

  return (
    <div className='flex justify-between gap-4 max-sm:flex-col sm:items-center'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Drivers</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Manage driver profiles, availability, licenses, and assignments.
        </p>
      </div>
      <Button className='gap-2' onClick={handleAddDriver}>
        <PlusIcon className='size-4' />
        Add driver
      </Button>
    </div>
  )
}

export default DriversHeader
