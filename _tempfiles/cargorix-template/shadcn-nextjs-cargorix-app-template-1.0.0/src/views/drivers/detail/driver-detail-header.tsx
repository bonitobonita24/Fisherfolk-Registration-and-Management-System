'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { toast } from 'sonner'
import { DownloadIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon, TruckIcon } from 'lucide-react'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Shared Imports
import PageBreadcrumb from '@/components/shared/page-breadcrumb'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'

// Data Imports
import { DRIVER_STATUS_BADGE } from '../driver-badges'

type DriverDetailHeaderProps = {
  driver: Driver
}

const DriverDetailHeader = ({ driver }: DriverDetailHeaderProps) => {
  // States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Hooks
  const router = useRouter()
  const deleteDriver = useDriversStore(state => state.deleteDriver)

  // Vars
  const onDuty = Boolean(driver.currentAssignment)
  const employmentBadge = DRIVER_STATUS_BADGE[driver.employmentStatus ?? 'inactive']

  const handleDelete = () => {
    deleteDriver(driver.id)
    toast.success(`${driver.name} deleted`)
    router.push('/drivers')
  }

  return (
    <div className='space-y-4'>
      <PageBreadcrumb parentLabel='Drivers' parentHref='/drivers' current={driver.name} />

      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-2xl font-bold tracking-tight lg:text-3xl'>{driver.name}</h1>
            {onDuty ? (
              <Badge className='bg-info-soft text-info'>On Duty</Badge>
            ) : (
              <Badge className={employmentBadge.className}>{employmentBadge.label}</Badge>
            )}
          </div>
          <p className='text-muted-foreground mt-1 text-sm'>Driver ID: {driver.id.toUpperCase()}</p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button className='gap-2' render={<Link href={`/drivers/create/${driver.id}`} />} nativeButton={false}>
            <PencilIcon data-icon='inline-start' />
            Edit driver
          </Button>
          <Button
            variant='secondary'
            className='gap-2'
            render={<Link href={`/drivers/create/${driver.id}#driver-assigned-vehicle`} />}
            nativeButton={false}
          >
            <TruckIcon data-icon='inline-start' />
            {driver.assignedVehicle ? 'Change vehicle' : 'Assign vehicle'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='secondary' size='icon' aria-label='More actions' />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem onClick={() => toast('Export started')}>
                <DownloadIcon data-icon='inline-start' />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem variant='destructive' onClick={() => setIsDeleteOpen(true)}>
                <Trash2Icon data-icon='inline-start' />
                Delete driver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete driver?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {driver.name} from the roster
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
    </div>
  )
}

export default DriverDetailHeader
