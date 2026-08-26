'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { EyeIcon, MoreHorizontalIcon, PencilIcon, TrashIcon, TruckIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { Driver } from '@/types/entities/driver'

// Component Imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'

type DriverRowActionsProps = {
  driver: Driver
}

const DriverRowActions = ({ driver }: DriverRowActionsProps) => {
  // States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Hooks
  const router = useRouter()
  const deleteDriver = useDriversStore(state => state.deleteDriver)

  const handleDelete = () => {
    deleteDriver(driver.id)
    toast.success(`${driver.name || 'Driver'} deleted`)
    setIsDeleteConfirmOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant='ghost' size='icon' className='size-8' aria-label='Row actions' />}
        >
          <MoreHorizontalIcon className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-fit'>
          <DropdownMenuItem onClick={() => router.push(`/drivers/${driver.id}`)}>
            <EyeIcon data-icon='inline-start' />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/drivers/create/${driver.id}`)}>
            <PencilIcon data-icon='inline-start' />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/drivers/create/${driver.id}#driver-assigned-vehicle`)}>
            <TruckIcon data-icon='inline-start' />
            Assign vehicle
          </DropdownMenuItem>
          <DropdownMenuItem variant='destructive' onClick={() => setIsDeleteConfirmOpen(true)}>
            <TrashIcon data-icon='inline-start' />
            Delete driver
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {driver.name || 'this driver'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the driver from the roster
              {driver.assignedVehicle ? ` and unassigns ${driver.assignedVehicle.vehicleId}` : ''}. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete driver</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default DriverRowActions
