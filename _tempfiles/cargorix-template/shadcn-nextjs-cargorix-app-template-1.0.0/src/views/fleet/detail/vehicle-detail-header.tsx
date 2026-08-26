'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { toast } from 'sonner'
import { CopyIcon, DownloadIcon, MoreHorizontalIcon, PencilIcon, RouteIcon, Trash2Icon } from 'lucide-react'

// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Shared Imports
import PageBreadcrumb from '@/components/shared/page-breadcrumb'

// Data Imports
import { VEHICLE_STATUS_BADGE } from '../vehicle-badges'

type VehicleDetailHeaderProps = {
  vehicle: Vehicle
}

const VehicleDetailHeader = ({ vehicle }: VehicleDetailHeaderProps) => {
  // Vars
  const status = vehicle.isDraft ? 'draft' : (vehicle.operationalStatus ?? 'available')
  const statusBadge = VEHICLE_STATUS_BADGE[status]

  return (
    <div className='space-y-4'>
      <PageBreadcrumb parentLabel='Fleet' parentHref='/fleet' current={vehicle.id} />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-2xl font-bold tracking-tight lg:text-3xl'>{vehicle.id}</h1>
            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
          </div>
          <p className='text-muted-foreground mt-1 text-sm'>
            {vehicle.make || vehicle.model ? `${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim() : 'Fleet vehicle'}
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button className='gap-2' render={<Link href={`/fleet/create/${vehicle.id}`} />} nativeButton={false}>
            <PencilIcon data-icon='inline-start' />
            Edit vehicle
          </Button>
          <Button variant='secondary' className='gap-2' onClick={() => toast('Route planner coming soon')}>
            <RouteIcon data-icon='inline-start' />
            Assign route
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='secondary' size='icon' aria-label='More actions' />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem onClick={() => toast('Vehicle duplicated')}>
                <CopyIcon data-icon='inline-start' />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast('Export started')}>
                <DownloadIcon data-icon='inline-start' />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem variant='destructive' onClick={() => toast('Vehicle deleted')}>
                <Trash2Icon data-icon='inline-start' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export default VehicleDetailHeader
