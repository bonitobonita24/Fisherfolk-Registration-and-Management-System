'use client'

// Third-party Imports
import { toast } from 'sonner'
import { MapPinnedIcon, WandSparklesIcon } from 'lucide-react'

// Type Imports
import type { MapMarker } from '@/components/shared/route-map'
import type { OptimizeMode } from '@/lib/selectors/route-selectors'
import type { Route } from '@/types/entities/route'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Shared Imports
import RouteMap from '@/components/shared/route-map'

// Store Imports
import { useRoutesStore } from '@/store/use-routes-store'

// Util Imports
import {
  EXACT_MAX_STOPS,
  OPTIMIZE_MODE_OPTIONS,
  isExactlyOptimisable,
  optimizeStops
} from '@/lib/selectors/route-selectors'

// Props
type RoutePreviewCardProps = {
  route: Route
  warehouse?: Warehouse
}

const RoutePreviewCard = ({ route, warehouse }: RoutePreviewCardProps) => {
  // Hooks
  const reorderStops = useRoutesStore(state => state.reorderStops)

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

  const canOptimize = route.stops.length > 1 && Boolean(warehouse)
  const heuristic = !isExactlyOptimisable(route.stops.length)

  const handleOptimize = (mode: OptimizeMode) => {
    const optimized = optimizeStops(route.stops, warehouse, mode, route.returnToStart)
    const changed = optimized.some((stop, index) => stop.id !== route.stops[index].id)

    if (changed) {
      reorderStops(
        route.id,
        optimized.map(stop => stop.id),
        warehouse
      )
      toast.success(mode === 'distance' ? 'Stops reordered to shorten the route' : 'Stops sorted by time window')
    } else {
      toast.info(mode === 'distance' ? 'Already the shortest order found' : 'Already in time-window order')
    }
  }

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='flex flex-wrap items-center justify-between gap-3 px-5 pt-5'>
        <div className='min-w-0'>
          <CardTitle>Route preview</CardTitle>
          <p className='text-muted-foreground mt-1 text-sm'>
            {route.stops.length} stops · {route.returnToStart ? 'Returns to depot' : 'One way'}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant='secondary' disabled={!canOptimize} />}>
            <WandSparklesIcon data-icon='inline-start' />
            Optimize
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            {OPTIMIZE_MODE_OPTIONS.map(option => (
              <DropdownMenuItem key={option.value} onClick={() => handleOptimize(option.value)}>
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className='space-y-3 p-4'>
        {markers.length > 0 ? (
          <div className='overflow-hidden rounded-2xl border'>
            <RouteMap markers={markers} routeWaypoints={waypoints} height={340} />
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center gap-2 py-16 text-center'>
            <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
              <MapPinnedIcon className='text-muted-foreground size-6' />
            </div>
            <p className='font-medium'>Nothing to map yet</p>
            <p className='text-muted-foreground text-sm'>Pick a start warehouse and add stops to preview the route.</p>
          </div>
        )}

        {heuristic && (
          <p className='text-muted-foreground text-xs'>
            Above {EXACT_MAX_STOPS} stops the optimiser uses a nearest-neighbour pass — never worse than the current
            order, but not provably the shortest.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default RoutePreviewCard
