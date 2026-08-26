'use client'

// Third-party Imports
import { toast } from 'sonner'
import { MapPinnedIcon } from 'lucide-react'

// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Shared Imports
import RouteMap from '@/components/shared/route-map'
import type { MapMarker } from '@/components/shared/route-map'

type CurrentAssignmentCardProps = {
  vehicle: Vehicle
}

const CurrentAssignmentCard = ({ vehicle }: CurrentAssignmentCardProps) => {
  // Vars
  const assignment = vehicle.currentAssignment
  const path = vehicle.path

  const routePath: [number, number][] | undefined =
    path.length > 1 ? path.map(([lat, lng]) => [lng, lat] as [number, number]) : undefined

  const markers: MapMarker[] = []

  if (path.length > 1) {
    const start = path[0]
    const end = path[path.length - 1]

    markers.push({ id: `${vehicle.id}-origin`, lat: start[0], lng: start[1], variant: 'waypoint' })
    markers.push({ id: `${vehicle.id}-dest`, lat: end[0], lng: end[1], variant: 'destination' })
  }

  markers.push({ id: `${vehicle.id}-pos`, lat: vehicle.lat, lng: vehicle.lng, label: vehicle.id, variant: 'vehicle' })

  const rows = assignment
    ? [
        { label: 'Route', value: assignment.routeName },
        { label: 'Shipment', value: assignment.shipmentName },
        { label: 'Origin', value: assignment.origin },
        { label: 'Destination', value: assignment.destination },
        { label: 'Next Stop', value: assignment.nextStop },
        { label: 'ETA', value: assignment.etaLabel }
      ]
    : []

  return (
    <Card>
      <CardHeader className='flex items-center justify-between'>
        <CardTitle>Current Assignment</CardTitle>
        {assignment && (
          <Button variant='link' size='sm' className='h-auto p-0' onClick={() => toast('Route planner coming soon')}>
            View full route
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {assignment ? (
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <dl className='space-y-3 text-sm'>
              {rows.map(row => (
                <div key={row.label} className='flex items-start justify-between gap-4'>
                  <dt className='text-muted-foreground'>{row.label}</dt>
                  <dd className='text-right font-medium'>{row.value || '—'}</dd>
                </div>
              ))}
            </dl>
            <div className='overflow-hidden rounded-lg border'>
              <RouteMap markers={markers} routePath={routePath} height={260} />
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center gap-2 py-12 text-center'>
            <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
              <MapPinnedIcon className='text-muted-foreground size-6' />
            </div>
            <p className='font-medium'>No active assignment</p>
            <p className='text-muted-foreground text-sm'>This vehicle is not currently assigned to a route.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CurrentAssignmentCard
