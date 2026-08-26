'use client'

// Third-party Imports
import { addMinutes, format } from 'date-fns'
import { TriangleAlertIcon } from 'lucide-react'

// Type Imports
import type { Route } from '@/types/entities/route'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// Util Imports
import { getCapacityKg } from '@/lib/selectors/fleet-selectors'
import { getRouteTotals } from '@/lib/selectors/route-selectors'
import { cn } from '@/lib/utils'

const formatDuration = (minutes: number) => {
  if (minutes <= 0) return '—'

  const hours = Math.floor(minutes / 60)

  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}

// Props
type RouteSummaryCardProps = {
  route: Route
  warehouse?: Warehouse
  vehicle?: Vehicle
}

const RouteSummaryCard = ({ route, warehouse, vehicle }: RouteSummaryCardProps) => {
  // Vars
  const totals = getRouteTotals(route, warehouse, vehicle)
  const startsAt = new Date(`${route.date.slice(0, 10)}T${(route.startTime || '00:00').slice(0, 5)}:00`)

  const estimatedEnd = Number.isNaN(startsAt.getTime())
    ? '—'
    : format(addMinutes(startsAt, totals.durationMinutes), 'HH:mm')

  const capacityKg = vehicle ? getCapacityKg(vehicle) : 0
  const overloaded = capacityKg > 0 && totals.weightKg > capacityKg
  const nearCapacity = totals.capacityPercent > 90

  const rows = [
    { label: 'Stops', value: `${totals.stopCount}` },
    { label: 'Distance', value: totals.distanceKm > 0 ? `${totals.distanceKm.toFixed(1)} km` : '—' },
    { label: 'Duration', value: formatDuration(totals.durationMinutes) },
    { label: 'Estimated end', value: estimatedEnd },
    { label: 'Packages', value: `${totals.packageCount}` },
    { label: 'Weight', value: `${totals.weightKg.toLocaleString()} kg` }
  ]

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>Route summary</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 p-4 text-sm'>
        <dl className='space-y-3'>
          {rows.map(row => (
            <div key={row.label} className='flex items-baseline justify-between gap-4'>
              <dt className='text-muted-foreground'>{row.label}</dt>
              <dd className='min-w-0 truncate text-right font-medium tabular-nums'>{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className='space-y-2'>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Capacity used</span>
            <span className='font-medium tabular-nums'>
              {capacityKg > 0 ? `${totals.capacityPercent}%` : 'No vehicle'}
            </span>
          </div>
          <Progress
            value={totals.capacityPercent}
            className={cn(
              overloaded && '[&_[data-slot=progress-indicator]]:bg-destructive',
              !overloaded && nearCapacity && '[&_[data-slot=progress-indicator]]:bg-warning'
            )}
          />
          {capacityKg > 0 && (
            <p className='text-muted-foreground text-xs tabular-nums'>
              {totals.weightKg.toLocaleString()} kg of {capacityKg.toLocaleString()} kg
            </p>
          )}
        </div>

        {overloaded && (
          <div className='bg-destructive/10 text-destructive flex items-start gap-2 rounded-2xl p-3 text-xs'>
            <TriangleAlertIcon className='mt-0.5 size-4 shrink-0' />
            <span>
              Over capacity by {(totals.weightKg - capacityKg).toLocaleString()} kg — drop a stop or pick a larger
              vehicle.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RouteSummaryCard
