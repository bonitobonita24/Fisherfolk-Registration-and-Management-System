// Third-party Imports
import { Clock3Icon, MapPinCheckIcon, RouteIcon, WarehouseIcon } from 'lucide-react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Card } from '@/components/ui/card'
import ShipmentHeader from './shipment-header'
import ShipmentInfoCard from './shipment-info-card'
import ShipmentResourcesCard from './shipment-resources-card'
import ShipmentRouteSection from './shipment-route-section'
import ShipmentTimeline from './shipment-timeline'
import ShipmentTrackingProofCard from './shipment-tracking-proof-card'

type ShipmentDetailProps = {
  shipment: Shipment
  order?: Order
  driver?: Driver
  vehicle?: Vehicle
  originWarehouse?: Warehouse
}

const ShipmentDetail = ({ shipment, order, driver, vehicle, originWarehouse }: ShipmentDetailProps) => {
  if (!order) {
    return (
      <div className='text-muted-foreground p-8 text-center text-sm'>Route unavailable — source order not found.</div>
    )
  }

  const stats = [
    { icon: RouteIcon, label: 'Distance', value: `${shipment.distanceKm} km` },
    { icon: Clock3Icon, label: 'Est. drive time', value: `${shipment.etaMinutes} min` },
    { icon: WarehouseIcon, label: 'Pickup', value: originWarehouse?.name ?? shipment.originHub ?? order.pickupAddress },
    { icon: MapPinCheckIcon, label: 'Delivery', value: order.deliveryAddress }
  ]

  return (
    <div className='space-y-6'>
      <Card className='gap-0 overflow-hidden py-0'>
        <ShipmentHeader shipment={shipment} order={order} />
        <div className='grid lg:grid-cols-[minmax(0,1fr)_330px]'>
          <ShipmentRouteSection shipment={shipment} order={order} originWarehouse={originWarehouse} />
          <div className='shrink border-t p-4 lg:border-t-0 lg:border-l'>
            <ShipmentTimeline timeline={shipment.timeline} />
          </div>
          <div className='col-span-full grid grid-cols-2 gap-4 border-t p-4 sm:grid-cols-4'>
            {stats.map(stat => (
              <div key={stat.label}>
                <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                  <stat.icon className='size-3.5' />
                  {stat.label}
                </p>
                <p className='mt-1 text-sm font-semibold'>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3'>
        <ShipmentInfoCard shipment={shipment} order={order} />
        <ShipmentResourcesCard driver={driver} vehicle={vehicle} />
        <div>
          <ShipmentTrackingProofCard shipment={shipment} />
        </div>
      </div>
    </div>
  )
}

export default ShipmentDetail
