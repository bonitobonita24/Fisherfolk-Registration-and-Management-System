'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { EyeIcon, MapPinnedIcon, MoreHorizontalIcon, PencilIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type VehicleRowActionsProps = {
  vehicle: Vehicle
}

const VehicleRowActions = ({ vehicle }: VehicleRowActionsProps) => {
  // Hooks
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='ghost' size='icon' className='size-8' aria-label='Row actions' />}>
        <MoreHorizontalIcon className='size-4' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-fit'>
        <DropdownMenuItem onClick={() => router.push(`/fleet/${vehicle.id}`)}>
          <EyeIcon data-icon='inline-start' />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/fleet/create/${vehicle.id}`)}>
          <PencilIcon data-icon='inline-start' />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast('Route planner coming soon')}>
          <MapPinnedIcon data-icon='inline-start' />
          Assign route
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default VehicleRowActions
