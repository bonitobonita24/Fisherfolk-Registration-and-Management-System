'use client'

// Third-party Imports
import { MapPinnedIcon } from 'lucide-react'

// Type Imports
import type { MapMarker } from '@/components/shared/route-map'
import type { Route } from '@/types/entities/route'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Shared Imports
import RouteMap from '@/components/shared/route-map'

type RouteMapCardProps = {
  route: Route
  warehouse?: Warehouse
}

const RouteMapCard = ({ route, warehouse }: RouteMapCardProps) => {
  // Vars
  const markers: MapMarker[] = [
    ...(warehouse ? [{ id: 'depot', lat: warehouse.lat, lng: warehouse.lng, variant: 'depot' as const }] : []),
    ...route.stops.map(stop => ({
      id: stop.id,
      lat: stop.lat,
      lng: stop.lng,
      label: String(stop.sequence),
      variant: 'stop' as const
    }))
  ]

  const waypoints: [number, number][] = [
    ...(warehouse ? [[warehouse.lng, warehouse.lat] as [number, number]] : []),
    ...route.stops.map(stop => [stop.lng, stop.lat] as [number, number]),
    ...(route.returnToStart && warehouse ? [[warehouse.lng, warehouse.lat] as [number, number]] : [])
  ]

  return (
    <Card>
      <CardHeader className='flex items-center justify-between'>
        <CardTitle>Route Map</CardTitle>
        <span className='text-muted-foreground text-sm'>
          {route.stops.length} stops · {route.returnToStart ? 'Returns to depot' : 'One way'}
        </span>
      </CardHeader>
      <CardContent>
        {markers.length > 0 ? (
          <div className='overflow-hidden rounded-lg border'>
            <RouteMap markers={markers} routeWaypoints={waypoints} height={380} />
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center gap-2 py-16 text-center'>
            <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
              <MapPinnedIcon className='text-muted-foreground size-6' />
            </div>
            <p className='font-medium'>Nothing to map yet</p>
            <p className='text-muted-foreground text-sm'>Add a start warehouse and stops to preview the route.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RouteMapCard
