// Type Imports
import type { MapMarker } from '@/components/shared/route-map'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'
import type { Warehouse } from '@/types/entities/warehouse'

// Shared Imports
import RouteMap from '@/components/shared/route-map'

type ShipmentRouteSectionProps = {
  shipment: Shipment
  order?: Order
  originWarehouse?: Warehouse
}

const ShipmentRouteSection = ({ shipment, order, originWarehouse }: ShipmentRouteSectionProps) => {
  if (!order) {
    return (
      <div className='text-muted-foreground p-8 text-center text-sm'>Route unavailable — source order not found.</div>
    )
  }

  // Vars
  const isReturned = shipment.status === 'returned'
  const isTerminal = shipment.status === 'delivered' || isReturned
  const originLat = originWarehouse?.lat ?? order.pickupLat
  const originLng = originWarehouse?.lng ?? order.pickupLng

  const markers: MapMarker[] = [
    {
      id: 'pickup',
      lat: originLat,
      lng: originLng,
      label: originWarehouse?.name ?? order.pickupAddress,
      variant: isTerminal ? 'depot' : 'origin'
    },
    {
      id: 'delivery',
      lat: order.deliveryLat,
      lng: order.deliveryLng,
      label: order.deliveryAddress,
      variant: isReturned ? 'failed' : 'destination'
    }
  ]

  const returnLeg: [number, number][] = [
    [originLng, originLat],
    [order.deliveryLng, order.deliveryLat],
    [originLng, originLat]
  ]

  return (
    <div>
      <RouteMap
        markers={markers}
        drawRoute={!isReturned}
        routeMarkerIds={['pickup', 'delivery']}
        routeWaypoints={isReturned ? returnLeg : undefined}
        height={420}
        className='z-1 rounded-none!'
      />
    </div>
  )
}

export default ShipmentRouteSection
