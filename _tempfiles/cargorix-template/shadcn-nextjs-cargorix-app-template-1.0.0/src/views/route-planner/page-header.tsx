'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { PlusIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

// Store Imports
import { useRoutesStore } from '@/store/use-routes-store'

const RoutePlannerHeader = () => {
  // Hooks
  const router = useRouter()

  const handleCreateRoute = () => {
    const id = crypto.randomUUID()

    useRoutesStore.getState().createDraftRoute(id)
    router.push(`/route-planner/create/${id}`)
  }

  return (
    <div className='flex justify-between gap-4 max-sm:flex-col sm:items-center'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Route Planner</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Plan delivery routes, sequence stops, and dispatch vehicles and drivers.
        </p>
      </div>
      <Button className='gap-2' onClick={handleCreateRoute}>
        <PlusIcon className='size-4' />
        Create route
      </Button>
    </div>
  )
}

export default RoutePlannerHeader
