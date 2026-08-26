// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChevronRightIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Badge } from '@/components/ui/badge'

// Util Imports
import { getShipmentTrackingSummary } from '@/lib/selectors/shipments-selectors'
import { cn } from '@/lib/utils'

// Data Imports
import { SHIPMENT_STATUS_BADGE } from '../shipment-badges'

type ShipmentTrackingCardProps = {
  shipment: Shipment
  order?: Order
  client?: Client
  driver?: Driver
  vehicle?: Vehicle
  isSelected: boolean
}

const ShipmentTrackingCard = ({ shipment, order, client, driver, vehicle, isSelected }: ShipmentTrackingCardProps) => {
  const summary = getShipmentTrackingSummary(shipment, driver, vehicle)
  const totalQty = order?.packages.reduce((sum, p) => sum + p.quantity, 0) ?? 0

  return (
    <Link
      href={`/shipments/${shipment.id}`}
      className={cn(
        'relative block p-4 pl-5 text-left transition-colors',
        isSelected ? 'bg-muted/50 border-primary border-b-0 border-l-4' : 'hover:bg-muted/50'
      )}
    >
      <div className='flex items-center justify-between gap-3'>
        <div className='min-w-0 space-y-1.5'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-foreground text-sm font-semibold'>{shipment.displayId}</span>
            <Badge className={SHIPMENT_STATUS_BADGE[shipment.status].className}>
              {SHIPMENT_STATUS_BADGE[shipment.status].label}
            </Badge>
          </div>
          <p className='truncate text-sm font-semibold'>{client?.name ?? 'Unknown client'}</p>
          <p className='text-muted-foreground text-xs'>
            Order {order?.displayId ?? '—'} · {totalQty} package{totalQty === 1 ? '' : 's'}
          </p>
          <p className='text-muted-foreground text-xs'>{summary.driverVehicleLabel}</p>
          <p className='text-muted-foreground text-xs'>{summary.scheduleLabel}</p>
        </div>
        <ChevronRightIcon className={cn('size-4 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
      </div>
    </Link>
  )
}

export default ShipmentTrackingCard
