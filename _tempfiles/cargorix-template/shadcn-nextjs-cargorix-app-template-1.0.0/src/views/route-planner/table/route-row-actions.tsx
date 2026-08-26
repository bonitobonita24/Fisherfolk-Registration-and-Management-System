'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { BanIcon, CopyIcon, EyeIcon, MoreHorizontalIcon, PencilIcon, TruckIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { Route } from '@/types/entities/route'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Store Imports
import { useRoutesStore } from '@/store/use-routes-store'

type RouteRowActionsProps = {
  route: Route
}

const RouteRowActions = ({ route }: RouteRowActionsProps) => {
  // Vars
  const canDispatch = route.status === 'ready'
  const canCancel = route.status === 'draft' || route.status === 'planned' || route.status === 'ready'

  // Hooks
  const router = useRouter()
  const duplicateRoute = useRoutesStore(state => state.duplicateRoute)
  const dispatchRoute = useRoutesStore(state => state.dispatchRoute)
  const cancelRoute = useRoutesStore(state => state.cancelRoute)

  const handleDuplicate = () => {
    const newId = duplicateRoute(route.id)

    if (!newId) {
      toast.error('Could not duplicate this route')

      return
    }

    toast.success(`${route.number} duplicated`)
    router.push(`/route-planner/create/${newId}`)
  }

  const handleDispatch = () => {
    if (!dispatchRoute(route.id)) {
      toast.error(`${route.number} is not ready to dispatch`)

      return
    }

    toast.success(`${route.number} dispatched`)
  }

  const handleCancel = () => {
    cancelRoute(route.id)
    toast.success(`${route.number} cancelled`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='ghost' size='icon' className='size-8' aria-label='Row actions' />}>
        <MoreHorizontalIcon className='size-4' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-fit'>
        {!route.isDraft && (
          <DropdownMenuItem onClick={() => router.push(`/route-planner/${route.id}`)}>
            <EyeIcon data-icon='inline-start' />
            View details
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => router.push(`/route-planner/create/${route.id}`)}>
          <PencilIcon data-icon='inline-start' />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate}>
          <CopyIcon data-icon='inline-start' />
          Duplicate
        </DropdownMenuItem>
        {canDispatch && (
          <DropdownMenuItem onClick={handleDispatch}>
            <TruckIcon data-icon='inline-start' />
            Dispatch
          </DropdownMenuItem>
        )}
        {canCancel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive' onClick={handleCancel}>
              <BanIcon data-icon='inline-start' />
              Cancel route
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default RouteRowActions
