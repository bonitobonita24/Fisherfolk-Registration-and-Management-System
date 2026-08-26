'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// Third-party Imports
import { Maximize2Icon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

// Util Imports
import { cn } from '@/lib/utils'

export type MapMarkerVariant = 'origin' | 'destination' | 'vehicle' | 'waypoint' | 'depot' | 'stop' | 'failed'

export interface MapMarker {
  id: string
  lat: number
  lng: number
  label?: string
  variant: MapMarkerVariant
}

export interface RouteMapProps {
  markers: MapMarker[]
  drawRoute?: boolean
  routeMarkerIds?: [string, string]

  routePath?: [number, number][]

  routeWaypoints?: [number, number][]
  className?: string
  height?: string | number
}

const RouteMapInner = dynamic(() => import('./route-map-inner'), {
  ssr: false,
  loading: () => <Skeleton className='size-full rounded-2xl' />
})

const RouteMap = ({
  markers,
  drawRoute,
  routeMarkerIds,
  routePath,
  routeWaypoints,
  className,
  height = 360
}: RouteMapProps) => {
  // States
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn('relative', className)} style={{ height }}>
      <RouteMapInner
        markers={markers}
        drawRoute={drawRoute}
        routeMarkerIds={routeMarkerIds}
        routePath={routePath}
        routeWaypoints={routeWaypoints}
        height={height}
      />
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='bg-background absolute top-3 right-3 gap-2 shadow'
        onClick={() => setExpanded(true)}
      >
        <Maximize2Icon className='size-4' />
        Expand
      </Button>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className='z-100 flex h-[calc(100%-3rem)] max-w-[calc(100%-3rem)] flex-col sm:max-w-[calc(100%-3rem)]'>
          <DialogTitle className='sr-only'>Expanded route map</DialogTitle>
          <RouteMapInner
            markers={markers}
            drawRoute={drawRoute}
            routeMarkerIds={routeMarkerIds}
            routePath={routePath}
            routeWaypoints={routeWaypoints}
            className='flex-1'
            height='100%'
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RouteMap
