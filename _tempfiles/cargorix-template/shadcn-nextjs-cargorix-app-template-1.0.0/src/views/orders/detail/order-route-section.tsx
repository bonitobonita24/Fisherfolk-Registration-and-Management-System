// Next Imports
import Link from 'next/link'

// Third-party Imports
import { RouteIcon } from 'lucide-react'

// Type Imports
import type { MapMarker } from '@/components/shared/route-map'
import type { Order } from '@/types/entities/order'
import type { Route } from '@/types/entities/route'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'

// Shared Imports
import RouteMap from '@/components/shared/route-map'

// Util Imports
import { getOrderRouteSummary } from '@/lib/selectors/orders-selectors'

type OrderRouteSectionProps = {
  order: Order
  route?: Route
  startWarehouse?: Warehouse
}

const OrderRouteSection = ({ order, route, startWarehouse }: OrderRouteSectionProps) => {
  // Vars
  const stop = route?.stops.find(item => item.orderId === order.id)
  const departsFrom = stop ? startWarehouse : undefined
  const summary = getOrderRouteSummary(order, departsFrom)
  const depotParts = departsFrom?.addressParts
  const originLabel = departsFrom?.name ?? order.pickupAddress

  const originDetail = depotParts
    ? `${depotParts.line1}, ${depotParts.city}, ${depotParts.state} ${depotParts.postalCode}`
    : order.pickupAddressDetail

  const showOrderPickup = Boolean(departsFrom) && order.pickupAddress !== departsFrom?.name

  const markers: MapMarker[] = [
    {
      id: 'pickup',
      lat: departsFrom?.lat ?? order.pickupLat,
      lng: departsFrom?.lng ?? order.pickupLng,
      label: originLabel,
      variant: 'origin'
    },
    {
      id: 'delivery',
      lat: order.deliveryLat,
      lng: order.deliveryLng,
      label: order.deliveryAddress,
      variant: 'destination'
    }
  ]

  return (
    <Card className='gap-0 overflow-hidden py-0'>
      <CardHeader className='border-b p-4'>
        <CardTitle>Requested route</CardTitle>
        <p className='text-muted-foreground text-sm'>
          {route && stop
            ? `Planned as stop ${stop.sequence} on dispatch route ${route.number}`
            : 'Planning preview before a shipment and dispatch route are created'}
        </p>
        <CardAction className='flex flex-wrap items-center gap-2'>
          {route && (
            <Button
              variant='outline'
              size='sm'
              className='gap-2'
              render={<Link href={`/route-planner/${route.id}`} />}
              nativeButton={false}
            >
              <RouteIcon data-icon='inline-start' />
              {route.number || 'View route'}
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <div className='grid lg:grid-cols-[minmax(0,1fr)_300px]'>
        <RouteMap markers={markers} drawRoute className='z-1 rounded-none!' height={370} />
        <div className='space-y-4 border-t p-4 lg:border-t-0'>
          <div>
            <p className='text-muted-foreground text-xs'>{departsFrom ? 'Departs from' : 'Pickup location'}</p>
            <p className='mt-1 text-sm font-semibold'>{originLabel}</p>
            {originDetail && <p className='text-muted-foreground mt-1 text-xs'>{originDetail}</p>}
            {showOrderPickup && (
              <p className='text-muted-foreground mt-1 text-xs'>Order pickup: {order.pickupAddress}</p>
            )}
          </div>
          <div>
            <p className='text-muted-foreground text-xs'>Delivery location</p>
            <p className='mt-1 text-sm font-semibold'>{order.deliveryAddress}</p>
            {order.deliveryAddressDetail && (
              <p className='text-muted-foreground mt-1 text-xs'>{order.deliveryAddressDetail}</p>
            )}
          </div>
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='bg-muted rounded-xl p-3'>
              <p className='text-muted-foreground text-xs'>{departsFrom ? 'Leg distance' : 'Distance'}</p>
              <p className='mt-1 font-semibold'>{summary.distanceKm} km</p>
            </div>
            <div className='bg-muted rounded-xl p-3'>
              <p className='text-muted-foreground text-xs'>{departsFrom ? 'Leg drive' : 'Est. drive'}</p>
              <p className='mt-1 font-semibold'>{summary.etaMinutes} min</p>
            </div>
            <div className='bg-muted rounded-xl p-3'>
              <p className='text-muted-foreground text-xs'>Suggested tolls</p>
              <p className='mt-1 font-semibold'>${summary.tollEstimate.toFixed(2)}</p>
            </div>
            <div className='bg-muted rounded-xl p-3'>
              <p className='text-muted-foreground text-xs'>Route type</p>
              <p className='mt-1 font-semibold'>Fastest</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default OrderRouteSection
