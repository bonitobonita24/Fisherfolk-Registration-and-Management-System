'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { PlusIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

// Store Imports
import { useVehiclesStore } from '@/store/use-vehicles-store'

const FleetHeader = () => {
  // Hooks
  const router = useRouter()

  const handleAddVehicle = () => {
    const id = crypto.randomUUID()

    useVehiclesStore.getState().createDraftVehicle(id)
    router.push(`/fleet/create/${id}`)
  }

  return (
    <div className='flex justify-between gap-4 max-sm:flex-col sm:items-center'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Fleet</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Manage vehicles, assignments, availability, and maintenance.
        </p>
      </div>
      <Button className='gap-2' onClick={handleAddVehicle}>
        <PlusIcon className='size-4' />
        Add vehicle
      </Button>
    </div>
  )
}

export default FleetHeader
