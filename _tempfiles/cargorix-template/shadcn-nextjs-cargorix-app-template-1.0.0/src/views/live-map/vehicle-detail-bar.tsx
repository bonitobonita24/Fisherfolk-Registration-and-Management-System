// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowRightIcon, BikeIcon, TruckIcon, UserIcon } from 'lucide-react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Util Imports
import { getVehicleStats } from '@/lib/selectors/fleet-selectors'

// Data Imports
import { VEHICLE_STATUS_BADGE } from './fleet-badges'

type VehicleDetailBarProps = {
  vehicle: Vehicle
  driver?: Driver
}

const VehicleDetailBar = ({ vehicle, driver }: VehicleDetailBarProps) => {
  // Vars
  const Icon = vehicle.type === 'motorcycle' ? BikeIcon : TruckIcon
  const badge = VEHICLE_STATUS_BADGE[vehicle.trackingStatus]
  const stats = getVehicleStats(vehicle)
  const firstLabel = vehicle.trackingStatus === 'idle' ? 'Location' : 'Next stop'

  const columns = [
    { label: firstLabel, value: stats.nextStop },
    { label: 'ETA', value: stats.eta },
    { label: 'Distance remaining', value: stats.distanceRemaining },
    { label: 'Stops completed', value: stats.stopsCompleted },
    { label: 'Delay alerts', value: stats.delayAlerts }
  ]

  return (
    <Card className='flex-row flex-wrap items-center justify-between gap-x-4 gap-y-6 p-4'>
      <div className='flex items-center gap-2'>
        <Icon className='text-muted-foreground size-4' />
        <span className='text-sm font-semibold'>{vehicle.id}</span>
      </div>
      <div className='flex items-center gap-2'>
        <UserIcon className='text-muted-foreground size-4' />
        <span className='text-sm'>{driver?.name ?? 'Unassigned'}</span>
      </div>
      <Badge className={badge.className}>{badge.label}</Badge>
      {columns.map(column => (
        <div key={column.label}>
          <p className='text-muted-foreground text-xs'>{column.label}</p>
          <p className='text-sm font-semibold'>{column.value}</p>
        </div>
      ))}
      {vehicle.shipmentId ? (
        <Link
          href={`/shipments/${vehicle.shipmentId}`}
          className={buttonVariants({ variant: 'default', className: 'gap-2' })}
        >
          View Shipment
          <ArrowRightIcon data-icon='inline-end' />
        </Link>
      ) : null}
    </Card>
  )
}

export default VehicleDetailBar
