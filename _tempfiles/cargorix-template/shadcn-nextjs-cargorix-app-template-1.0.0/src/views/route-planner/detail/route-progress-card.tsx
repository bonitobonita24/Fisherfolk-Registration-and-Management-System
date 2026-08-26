// Next Imports
import Link from 'next/link'

// Third-party Imports
import { format } from 'date-fns'
import { MapIcon } from 'lucide-react'

// Type Imports
import type { Route, RouteTotals } from '@/types/entities/route'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { getRouteProgress } from '@/lib/selectors/route-selectors'

type RouteProgressCardProps = {
  route: Route
  totals: RouteTotals
  estimatedEnd: string
}

const RADIUS = 15.5
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const formatTime = (value?: string) => {
  if (!value) return '—'

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? '—' : format(parsed, 'HH:mm')
}

const RouteProgressCard = ({ route, totals, estimatedEnd }: RouteProgressCardProps) => {
  // Vars
  const progress = getRouteProgress(route)
  const nextStop = progress.currentStop ?? route.stops.find(stop => stop.status === 'pending')

  const rows = [
    { label: 'Current stop', value: nextStop ? `#${nextStop.sequence} · ${nextStop.customerName}` : '—' },
    { label: 'Next ETA', value: formatTime(nextStop?.etaAt) },
    { label: 'Estimated end', value: estimatedEnd },
    { label: 'Capacity used', value: totals.capacityPercent > 0 ? `${totals.capacityPercent}%` : '—' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Progress</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex flex-col items-center gap-2'>
          <div className='relative size-32'>
            <svg viewBox='0 0 36 36' className='size-full -rotate-90'>
              <circle
                cx='18'
                cy='18'
                r={RADIUS}
                fill='none'
                stroke='currentColor'
                strokeWidth='3'
                className='text-muted'
              />
              <circle
                cx='18'
                cy='18'
                r={RADIUS}
                fill='none'
                stroke='currentColor'
                strokeWidth='3'
                strokeLinecap='round'
                strokeDasharray={`${(progress.percent / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                className='text-primary transition-all'
              />
            </svg>
            <div className='absolute inset-0 flex flex-col items-center justify-center'>
              <span className='text-2xl font-bold tabular-nums'>{progress.percent}%</span>
              <span className='text-muted-foreground text-xs'>complete</span>
            </div>
          </div>
          <p className='text-sm font-medium tabular-nums'>
            {progress.completedStops} of {progress.totalStops} stops completed
          </p>
        </div>

        <dl className='space-y-3 text-sm'>
          {rows.map(row => (
            <div key={row.label} className='flex items-start justify-between gap-4'>
              <dt className='text-muted-foreground'>{row.label}</dt>
              <dd className='min-w-0 truncate text-right font-medium'>{row.value}</dd>
            </div>
          ))}
        </dl>

        {route.vehicleId && (
          <Button
            variant='outline'
            className='w-full gap-2'
            render={<Link href={`/live-map/${route.vehicleId}`} />}
            nativeButton={false}
          >
            <MapIcon data-icon='inline-start' />
            View Live Map
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default RouteProgressCard
