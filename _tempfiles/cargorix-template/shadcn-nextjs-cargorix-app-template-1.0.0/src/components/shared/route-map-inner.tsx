'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// Third-party Imports
import { HouseIcon, XIcon } from 'lucide-react'

// Type Imports
import type { MapMarker, MapMarkerVariant } from './route-map'

// Component Imports
import {
  Map,
  MapMarker as GlMarker,
  MarkerContent,
  MapRoute,
  MapControls as GlMapControls,
  useMap
} from '@/components/ui/map'

// Util Imports
import { cn } from '@/lib/utils'

const ROUTE_COLOR = '#0284c7' // sky-600
const DESTINATION_COLOR = '#16a34a' // green-600

function RouteMarkerContent({ variant, label }: { variant: MapMarkerVariant; label?: string }) {
  if (variant === 'depot') {
    return (
      <MarkerContent>
        <span className='bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full border-2 border-white shadow'>
          <HouseIcon className='size-3.5' />
        </span>
      </MarkerContent>
    )
  }

  if (variant === 'failed') {
    return (
      <MarkerContent>
        <span className='bg-destructive flex size-7 items-center justify-center rounded-full border-2 border-white text-white shadow'>
          <XIcon className='size-3.5' />
        </span>
      </MarkerContent>
    )
  }

  if (variant === 'stop' && label) {
    return (
      <MarkerContent>
        <span className='bg-foreground text-background flex size-6 items-center justify-center rounded-full border-2 border-white text-xs font-semibold shadow'>
          {label}
        </span>
      </MarkerContent>
    )
  }

  if (variant === 'origin' || variant === 'vehicle') {
    return (
      <MarkerContent>
        <span style={{ fontSize: 22, lineHeight: 1 }}>🚚</span>
      </MarkerContent>
    )
  }

  if (variant === 'destination') {
    return (
      <MarkerContent>
        <span
          style={{
            display: 'block',
            width: 14,
            height: 14,
            borderRadius: 9999,
            background: DESTINATION_COLOR,
            border: '3px solid white',
            boxShadow: '0 0 0 2px rgba(22,163,74,.35)'
          }}
        />
      </MarkerContent>
    )
  }

  return (
    <MarkerContent>
      <span
        style={{
          display: 'block',
          width: 10,
          height: 10,
          borderRadius: 9999,
          background: ROUTE_COLOR,
          border: '2px solid white'
        }}
      />
    </MarkerContent>
  )
}

function FitToMarkers({
  markers,
  path,
  waypoints
}: {
  markers: MapMarker[]
  path?: [number, number][]
  waypoints?: [number, number][]
}) {
  const { map } = useMap()

  const key = `${markers.map(m => `${m.lng},${m.lat}`).join(';')}|${path?.map(p => p.join(',')).join(';') ?? ''}|${waypoints?.map(p => p.join(',')).join(';') ?? ''}`

  useEffect(() => {
    if (!map) return

    const lngs = [...markers.map(m => m.lng), ...(path?.map(p => p[0]) ?? []), ...(waypoints?.map(p => p[0]) ?? [])]
    const lats = [...markers.map(m => m.lat), ...(path?.map(p => p[1]) ?? []), ...(waypoints?.map(p => p[1]) ?? [])]

    if (lngs.length === 0) return

    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      ],
      { padding: 48, maxZoom: 15 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key])

  return null
}

interface OsrmResponse {
  routes?: { geometry?: { coordinates?: [number, number][] } }[]
}

function RouteLoadingIndicator() {
  return (
    <div className='bg-background/90 pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full border px-2.5 py-1.5 shadow'>
      <span className='bg-muted-foreground/60 size-1.5 animate-pulse rounded-full' />
      <span className='bg-muted-foreground/60 size-1.5 animate-pulse rounded-full [animation-delay:150ms]' />
      <span className='bg-muted-foreground/60 size-1.5 animate-pulse rounded-full [animation-delay:300ms]' />
    </div>
  )
}

function OsrmRoute({ from, to }: { from: MapMarker; to: MapMarker }) {
  // States
  const [path, setPath] = useState<[number, number][] | null>(null)

  useEffect(() => {
    let cancelled = false

    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`

    fetch(url)
      .then(res => (res.ok ? (res.json() as Promise<OsrmResponse>) : Promise.reject(new Error('OSRM request failed'))))
      .then(data => {
        if (cancelled) return
        const coords = data.routes?.[0]?.geometry?.coordinates

        setPath(
          coords?.length
            ? coords
            : [
                [from.lng, from.lat],
                [to.lng, to.lat]
              ]
        )
      })
      .catch(() => {
        if (!cancelled)
          setPath([
            [from.lng, from.lat],
            [to.lng, to.lat]
          ])
      })

    return () => {
      cancelled = true
    }
  }, [from.lat, from.lng, to.lat, to.lng])

  if (!path) return <RouteLoadingIndicator />

  return <MapRoute id='route-map-route' coordinates={path} color={ROUTE_COLOR} width={5} opacity={0.8} />
}

function PathRoute({ path }: { path: [number, number][] }) {
  // States
  const [snapped, setSnapped] = useState<[number, number][]>(path)

  // Vars
  const key = path.map(p => `${p[0]},${p[1]}`).join(';')

  useEffect(() => {
    if (path.length < 2) return

    let cancelled = false
    const coords = path.map(p => `${p[0]},${p[1]}`).join(';')
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`

    fetch(url)
      .then(res => (res.ok ? (res.json() as Promise<OsrmResponse>) : Promise.reject(new Error('OSRM request failed'))))
      .then(data => {
        if (cancelled) return
        const coordinates = data.routes?.[0]?.geometry?.coordinates

        if (coordinates?.length) setSnapped(coordinates)
      })
      .catch(() => {
        if (!cancelled) setSnapped(path)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (path.length < 2) return null

  return <MapRoute id='route-map-path' coordinates={snapped} color={ROUTE_COLOR} width={5} opacity={0.8} />
}

function OsrmWaypointRoute({ waypoints }: { waypoints: [number, number][] }) {
  // States
  const [path, setPath] = useState<[number, number][]>(waypoints)

  // Vars
  const key = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${key}?overview=full&geometries=geojson`
        )

        if (!res.ok) return

        const data: OsrmResponse = await res.json()
        const coordinates = data.routes?.[0]?.geometry?.coordinates

        if (!cancelled && coordinates && coordinates.length > 1) setPath(coordinates)
      } catch {}
    }

    run()

    return () => {
      cancelled = true
    }
  }, [key])

  return <MapRoute id='route-map-waypoints' coordinates={path} color={ROUTE_COLOR} width={5} opacity={0.8} />
}

interface RouteMapInnerProps {
  markers: MapMarker[]
  drawRoute?: boolean
  routeMarkerIds?: [string, string]
  routePath?: [number, number][]
  routeWaypoints?: [number, number][]
  className?: string
  height?: string | number
}

const RouteMapInner = ({
  markers,
  drawRoute,
  routeMarkerIds,
  routePath,
  routeWaypoints,
  className,
  height = 360
}: RouteMapInnerProps) => {
  const routePair = useMemo(() => {
    if (!drawRoute) return null

    if (routeMarkerIds) {
      const from = markers.find(m => m.id === routeMarkerIds[0])
      const to = markers.find(m => m.id === routeMarkerIds[1])

      return from && to ? { from, to } : null
    }

    const from = markers.find(m => m.variant === 'origin')
    const to = markers.find(m => m.variant === 'destination')

    return from && to ? { from, to } : null
  }, [drawRoute, routeMarkerIds, markers])

  const center: [number, number] = markers.length > 0 ? [markers[0].lng, markers[0].lat] : [-73.9857, 40.7484]

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height }}>
      <Map center={center} zoom={12} className='size-full'>
        {markers.map(marker => (
          <GlMarker key={marker.id} longitude={marker.lng} latitude={marker.lat}>
            <RouteMarkerContent variant={marker.variant} label={marker.label} />
          </GlMarker>
        ))}
        {routeWaypoints && routeWaypoints.length > 1 ? (
          <OsrmWaypointRoute key={routeWaypoints.map(p => p.join(',')).join(';')} waypoints={routeWaypoints} />
        ) : routePath && routePath.length > 1 ? (
          <PathRoute path={routePath} />
        ) : routePair ? (
          <OsrmRoute key={`${routePair.from.id}-${routePair.to.id}`} from={routePair.from} to={routePair.to} />
        ) : null}
        <FitToMarkers markers={markers} path={routePath} waypoints={routeWaypoints} />
        <GlMapControls position='bottom-right' />
      </Map>
    </div>
  )
}

export default RouteMapInner
