// Next Imports
import Link from 'next/link'

// Third-party Imports
import { format } from 'date-fns'
import { BikeIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Badge } from '@/components/ui/badge'

// Util Imports
import { cn } from '@/lib/utils'

// Data Imports
import { VEHICLE_STATUS_BADGE } from '../fleet-badges'

type FleetVehicleCardProps = {
  vehicle: Vehicle
  driver?: Driver
  isSelected: boolean
}

const FleetVehicleCard = ({ vehicle, driver, isSelected }: FleetVehicleCardProps) => {
  // Vars
  const Icon = vehicle.type === 'motorcycle' ? BikeIcon : TruckIcon
  const badge = VEHICLE_STATUS_BADGE[vehicle.trackingStatus]

  let secondLine = ''
  let rightValue = '—'
  let rightSub: string | null = null

  if (vehicle.trackingStatus === 'on_route' || vehicle.trackingStatus === 'delayed') {
    secondLine = `Next stop: ${vehicle.nextStopLabel ?? '—'}`
    rightValue = vehicle.etaAt ? format(new Date(vehicle.etaAt), 'HH:mm') : '—'
    rightSub = vehicle.delayMinutes ? `+${vehicle.delayMinutes} min` : null
  } else if (vehicle.trackingStatus === 'completed') {
    secondLine = `Completed ${vehicle.stopsCompleted} stops`
    rightValue = vehicle.etaAt ? format(new Date(vehicle.etaAt), 'HH:mm') : '—'
  } else {
    secondLine = `Location: ${vehicle.currentLocationLabel ?? 'Unknown'}`
    rightValue = '—'
  }

  return (
    <Link
      href={`/live-map/${vehicle.id}`}
      className={cn(
        'relative block p-4 pl-5 text-left transition-colors',
        isSelected ? 'bg-muted/50 border-primary border-b-0 border-l-4' : 'hover:bg-muted/50'
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3'>
          <Icon className='text-muted-foreground mt-0.5 size-4' />
          <div className='space-y-0.5'>
            <p className='text-sm font-semibold'>{vehicle.id}</p>
            <p className='text-muted-foreground text-xs'>{driver?.name ?? 'Unassigned'}</p>
            <p className='text-muted-foreground text-xs'>{secondLine}</p>
          </div>
        </div>
        <div className='shrink-0 text-right'>
          <Badge className={badge.className}>{badge.label}</Badge>
          <p className='mt-1 text-xs font-semibold'>{rightValue}</p>
          {rightSub && <p className='text-destructive text-xs font-semibold'>{rightSub}</p>}
        </div>
      </div>
    </Link>
  )
}

export default FleetVehicleCard
