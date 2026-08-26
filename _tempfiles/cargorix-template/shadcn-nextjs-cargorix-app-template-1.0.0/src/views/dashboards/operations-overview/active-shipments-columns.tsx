'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRightIcon, ClockIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { ActiveShipmentRow } from '@/types/dashboards/operations-overview-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// Util Imports
import { cn } from '@/lib/utils'

// Data Imports
import { SHIPMENT_STATUS_BADGE } from '@/views/shipments/shipment-badges'

const activeShipmentColumns: ColumnDef<ActiveShipmentRow>[] = [
  {
    header: 'Vehicle',
    accessorKey: 'vehicleId',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span className='bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
          <TruckIcon className='size-4' />
        </span>
        <div className='flex min-w-0 flex-col'>
          <span className='truncate font-medium'>{row.original.vehicleId}</span>
          <span className='text-muted-foreground truncate text-xs'>{row.original.registrationNo}</span>
        </div>
      </div>
    )
  },
  {
    header: 'Shipment',
    accessorKey: 'displayId',
    cell: ({ row }) => <span className='font-medium'>{row.original.displayId}</span>
  },
  {
    header: 'Route',
    accessorKey: 'destination',
    cell: ({ row }) => (
      <div className='text-muted-foreground flex min-w-0 items-center gap-1.5'>
        <span className='truncate'>{row.original.origin}</span>
        <ArrowRightIcon className='size-3.5 shrink-0' />
        <span className='truncate'>{row.original.destination}</span>
      </div>
    )
  },
  {
    header: 'ETA',
    accessorKey: 'eta',
    cell: ({ row }) => (
      <span className='text-muted-foreground flex items-center gap-1.5 whitespace-nowrap'>
        <ClockIcon className='size-3.5 shrink-0' />
        {row.original.eta}
      </span>
    )
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => (
      <Badge className={SHIPMENT_STATUS_BADGE[row.original.status].className}>
        {SHIPMENT_STATUS_BADGE[row.original.status].label}
      </Badge>
    )
  },
  {
    header: 'Progress',
    accessorKey: 'progress',
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        <Progress
          value={row.original.progress}
          className={cn(
            'w-32 *:data-[slot=progress-track]:h-1.5',
            row.original.progress === 0 && '**:data-[slot=progress-indicator]:bg-muted-foreground/40!'
          )}
        />
        <span className='text-sm tabular-nums'>{Math.round(row.original.progress)}%</span>
      </div>
    )
  }
]

export default activeShipmentColumns
