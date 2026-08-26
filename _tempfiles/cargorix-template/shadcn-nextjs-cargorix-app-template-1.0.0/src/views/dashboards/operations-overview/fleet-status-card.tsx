'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import type { LucideIcon } from 'lucide-react'
import { ArrowRightIcon, CircleCheckIcon, CirclePauseIcon, TriangleAlertIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { FleetStatusKey } from '@/types/dashboards/operations-overview-types'
import { FLEET_STATUS_LABELS } from '@/types/dashboards/operations-overview-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Store Imports
import { useVehiclesStore } from '@/store/use-vehicles-store'

// Util Imports
import { getFleetStatusBreakdown } from '@/lib/selectors/operations-selectors'
import { cn } from '@/lib/utils'

type FleetStatusCardProps = {
  className?: string
}

const STATUS_ICON: Record<FleetStatusKey, LucideIcon> = {
  on_route: TruckIcon,
  delayed: TriangleAlertIcon,
  completed: CircleCheckIcon,
  idle: CirclePauseIcon
}

const STATUS_BAR: Record<FleetStatusKey, string> = {
  on_route: 'bg-primary text-primary-foreground',
  delayed: 'bg-warning text-white',
  completed: 'bg-success text-white',
  idle: 'bg-muted text-muted-foreground'
}

const FleetStatusCard = ({ className }: FleetStatusCardProps) => {
  // Hooks
  const vehicles = useVehiclesStore(state => state.vehicles)

  // Vars
  const buckets = getFleetStatusBreakdown(vehicles).filter(bucket => bucket.count > 0)

  return (
    <Card className={className}>
      <CardHeader className='border-b'>
        <CardTitle className='text-lg'>Fleet status</CardTitle>
        <CardAction>
          <Button size='sm' variant='outline' render={<Link href='/live-map' />} nativeButton={false}>
            Live map
            <ArrowRightIcon data-icon='inline-end' />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className='text-muted-foreground flex text-sm'>
        {buckets.map(bucket => (
          <div key={bucket.status} className='flex min-w-0 flex-col gap-1' style={{ flex: `${bucket.count} 1 0%` }}>
            <span className='truncate'>{FLEET_STATUS_LABELS[bucket.status]}</span>
            <div className='bg-muted-foreground h-2.5 w-0.5 rounded-full' />
          </div>
        ))}
      </CardContent>

      <CardContent>
        <div className='flex overflow-hidden rounded-md'>
          {buckets.map(bucket => (
            <div
              key={bucket.status}
              className={cn('min-w-0 truncate p-3 text-sm', STATUS_BAR[bucket.status])}
              style={{ flex: `${bucket.count} 1 0%` }}
            >
              {bucket.percentage}%
            </div>
          ))}
        </div>
      </CardContent>

      <CardContent>
        {buckets.map((bucket, index) => {
          const Icon = STATUS_ICON[bucket.status]

          return (
            <div
              key={bucket.status}
              className={cn(
                'flex items-center justify-between gap-4 px-2 py-3 text-base',
                index !== buckets.length - 1 && 'border-b'
              )}
            >
              <div className='text-muted-foreground flex items-center gap-4'>
                <Icon className='size-4' />
                <span>{FLEET_STATUS_LABELS[bucket.status]}</span>
              </div>
              <div className='flex items-center gap-4'>
                <span className='font-medium'>
                  {bucket.distanceRemainingKm > 0 ? `${bucket.distanceRemainingKm.toLocaleString()} km` : '—'}
                </span>
                <span className='text-muted-foreground text-sm'>
                  {bucket.count} {bucket.count === 1 ? 'vehicle' : 'vehicles'}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default FleetStatusCard
