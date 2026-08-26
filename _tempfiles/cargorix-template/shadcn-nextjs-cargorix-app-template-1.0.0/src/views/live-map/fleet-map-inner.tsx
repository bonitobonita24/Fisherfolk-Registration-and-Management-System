'use client'

// React Imports
import { Fragment, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

// Third-party Imports
import { BikeIcon, CheckIcon, LocateFixedIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { Vehicle, VehicleTrackingStatus } from '@/types/entities/vehicle'

// Component Imports
import {
  Map,
  MapMarker as GlMarker,
  MarkerContent,
  MapRoute,
  MapControls as GlMapControls,
  useMap
} from '@/components/ui/map'
import { Button } from '@/components/ui/button'

// Util Imports
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<VehicleTrackingStatus, string> = {
  on_route: '#0284c7', // sky-600 (info)
  delayed: '#d97706', // amber-600 (warning)
  completed: '#16a34a', // green-600 (success)
  idle: '#6b7280' // gray-500 (muted)
}

const DELAYED_DASH: [number, number] = [2, 1.5]

interface OsrmResponse {
  routes?: { geometry?: { coordinates?: [number, number][] } }[]
}

function useRoadPath(path: [number, number][]): [number, number][] {
  // Vars
  const straight: [number, number][] = path.map(([lat, lng]) => [lng, lat])
  const pathKey = path.map(([lat, lng]) => `${lat},${lng}`).join(';')

  // States
  const [snapped, setSnapped] = useState<[number, number][] | null>(null)

  useEffect(() => {
    if (path.length < 2) return

    let cancelled = false
    const coords = path.map(([lat, lng]) => `${lng},${lat}`).join(';')
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`

    fetch(url)
      .then(res => (res.ok ? (res.json() as Promise<OsrmResponse>) : Promise.reject(new Error('OSRM request failed'))))
      .then(data => {
        if (cancelled) return
        const geometry = data.routes?.[0]?.geometry?.coordinates

        setSnapped(geometry?.length ? geometry : null)
      })
      .catch(() => {
        if (!cancelled) setSnapped(null)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathKey])

  return snapped ?? straight
}

function VehicleRouteLayer({ vehicle, selectedVehicleId }: { vehicle: Vehicle; selectedVehicleId?: string }) {
  // Vars
  const color = STATUS_COLOR[vehicle.trackingStatus]
  const isSelected = vehicle.id === selectedVehicleId

  // Hooks
  const roadPath = useRoadPath(vehicle.path)

  return (
    <MapRoute
      id={`${vehicle.id}-path`}
      coordinates={roadPath}
      color={color}
      width={isSelected ? 5 : 3}
      opacity={selectedVehicleId ? (isSelected ? 0.95 : 0.25) : 0.8}
      dashArray={vehicle.trackingStatus === 'delayed' ? DELAYED_DASH : undefined}
    />
  )
}

function VehicleMarkerContent({ vehicle, isSelected }: { vehicle: Vehicle; isSelected: boolean }) {
  // Vars
  const color = STATUS_COLOR[vehicle.trackingStatus]
  const Icon = vehicle.type === 'motorcycle' ? BikeIcon : TruckIcon
  const size = isSelected ? 40 : 30

  const style: CSSProperties = {
    width: size,
    height: size,
    background: color,
    boxShadow: isSelected ? `0 0 0 4px ${color}40, 0 6px 14px rgba(0,0,0,.3)` : '0 1px 4px rgba(0,0,0,.3)'
  }

  if (isSelected) (style as Record<string, string | number>)['--heartbeat-color'] = color

  return (
    <MarkerContent>
      <div
        className={cn(
          'relative grid place-items-center rounded-full border-2 border-white text-white',
          isSelected && 'animate-heartbeat'
        )}
        style={style}
      >
        <Icon style={{ width: size * 0.46, height: size * 0.46 }} strokeWidth={2.25} />
        {vehicle.trackingStatus === 'delayed' && vehicle.delayMinutes && (
          <span
            className='absolute -top-2.5 -right-4 rounded-full border border-white px-1.5 py-0.5 text-xs leading-none font-semibold text-white'
            style={{ background: STATUS_COLOR.delayed, boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}
          >
            +{vehicle.delayMinutes}m
          </span>
        )}
      </div>
    </MarkerContent>
  )
}

function StopMarkerContent({ completed }: { completed: boolean }) {
  return (
    <MarkerContent>
      {completed ? (
        <div
          className='grid place-items-center rounded-full border-2 border-white text-white'
          style={{ width: 16, height: 16, background: STATUS_COLOR.completed, boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}
        >
          <CheckIcon className='size-2.5' strokeWidth={3.5} />
        </div>
      ) : (
        <div
          className='rounded-full border-2 bg-white'
          style={{ width: 11, height: 11, borderColor: STATUS_COLOR.on_route, boxShadow: '0 1px 2px rgba(0,0,0,.25)' }}
        />
      )}
    </MarkerContent>
  )
}

function IdleMarkerContent({ isSelected }: { isSelected: boolean }) {
  const size = isSelected ? 22 : 16

  return (
    <MarkerContent>
      <div
        className={cn('rounded-full border-2 border-white', isSelected && 'animate-heartbeat')}
        style={{
          width: size,
          height: size,
          background: STATUS_COLOR.idle,
          boxShadow: isSelected ? `0 0 0 4px ${STATUS_COLOR.idle}40` : '0 1px 3px rgba(0,0,0,.3)',
          ...(isSelected ? ({ ['--heartbeat-color']: STATUS_COLOR.idle } as CSSProperties) : {})
        }}
      />
    </MarkerContent>
  )
}

function getFleetBounds(vehicles: Vehicle[]): [[number, number], [number, number]] | null {
  if (vehicles.length === 0) return null

  const lngs = vehicles.map(v => v.lng)
  const lats = vehicles.map(v => v.lat)

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  ]
}

function getVehicleFocusBounds(vehicle: Vehicle): [[number, number], [number, number]] {
  const points: [number, number][] = [
    [vehicle.lng, vehicle.lat],
    ...vehicle.path.map(([lat, lng]) => [lng, lat] as [number, number]),
    ...vehicle.stops.map(stop => [stop.lng, stop.lat] as [number, number])
  ]

  const lngs = points.map(point => point[0])
  const lats = points.map(point => point[1])

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  ]
}

function FitToFleet({ vehicles, selectedVehicleId }: { vehicles: Vehicle[]; selectedVehicleId?: string }) {
  const { map } = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (!map || fitted.current || selectedVehicleId) return

    const bounds = getFleetBounds(vehicles)

    if (!bounds) return
    map.fitBounds(bounds, { padding: 64 })
    fitted.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  return null
}

function FocusSelected({ vehicles, selectedVehicleId }: { vehicles: Vehicle[]; selectedVehicleId?: string }) {
  const { map } = useMap()

  useEffect(() => {
    if (!map || !selectedVehicleId) return

    const vehicle = vehicles.find(v => v.id === selectedVehicleId)

    if (!vehicle) return

    const [southWest, northEast] = getVehicleFocusBounds(vehicle)
    const isSinglePoint = southWest[0] === northEast[0] && southWest[1] === northEast[1]

    if (isSinglePoint) {
      map.flyTo({ center: [vehicle.lng, vehicle.lat], zoom: 13.5, duration: 900, essential: true })

      return
    }

    map.fitBounds([southWest, northEast], { padding: 80, maxZoom: 14, duration: 900 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedVehicleId])

  return null
}

function FleetMapControls({ vehicles }: { vehicles: Vehicle[] }) {
  const { map } = useMap()

  const recenter = () => {
    const bounds = getFleetBounds(vehicles)

    if (!map || !bounds) return
    map.fitBounds(bounds, { padding: 64, duration: 700 })
  }

  return (
    <div className='absolute top-4 right-4 z-10 flex flex-col gap-2'>
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='bg-background size-9 shadow'
        onClick={recenter}
        aria-label='Recenter map'
      >
        <LocateFixedIcon className='size-4' />
      </Button>
    </div>
  )
}

interface FleetMapInnerProps {
  vehicles: Vehicle[]
  selectedVehicleId?: string
  onSelectVehicle?: (id: string) => void
  className?: string
  height?: string | number
}

const FleetMapInner = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  className,
  height = 480
}: FleetMapInnerProps) => {
  // Vars
  const center: [number, number] = vehicles.length > 0 ? [vehicles[0].lng, vehicles[0].lat] : [-73.9857, 40.7484]

  const ordered = [...vehicles].sort((a, b) => Number(a.id === selectedVehicleId) - Number(b.id === selectedVehicleId))

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height }}>
      <Map center={center} zoom={12} className='size-full'>
        {ordered.map(vehicle => {
          const isSelected = vehicle.id === selectedVehicleId

          return (
            <Fragment key={vehicle.id}>
              {vehicle.trackingStatus !== 'idle' && vehicle.path.length > 1 && (
                <VehicleRouteLayer vehicle={vehicle} selectedVehicleId={selectedVehicleId} />
              )}
              {vehicle.trackingStatus === 'idle' ? (
                <GlMarker longitude={vehicle.lng} latitude={vehicle.lat} onClick={() => onSelectVehicle?.(vehicle.id)}>
                  <IdleMarkerContent isSelected={isSelected} />
                </GlMarker>
              ) : (
                (vehicle.trackingStatus !== 'completed' || isSelected) && (
                  <GlMarker
                    longitude={vehicle.lng}
                    latitude={vehicle.lat}
                    onClick={() => onSelectVehicle?.(vehicle.id)}
                  >
                    <VehicleMarkerContent vehicle={vehicle} isSelected={isSelected} />
                  </GlMarker>
                )
              )}
            </Fragment>
          )
        })}
        {selectedVehicle?.stops.map(stop => (
          <GlMarker key={stop.id} longitude={stop.lng} latitude={stop.lat}>
            <StopMarkerContent completed={stop.completed} />
          </GlMarker>
        ))}
        <FitToFleet vehicles={vehicles} selectedVehicleId={selectedVehicleId} />
        <FocusSelected vehicles={vehicles} selectedVehicleId={selectedVehicleId} />
        <FleetMapControls vehicles={vehicles} />
        <GlMapControls position='bottom-right' />
      </Map>
    </div>
  )
}

export default FleetMapInner
