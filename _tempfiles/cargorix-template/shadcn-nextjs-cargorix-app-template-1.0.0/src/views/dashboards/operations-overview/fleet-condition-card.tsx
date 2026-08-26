'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowRightIcon } from 'lucide-react'

// Type Imports
import type { FleetConditionKey } from '@/types/dashboards/operations-overview-types'
import { FLEET_CONDITION_DETAILS, FLEET_CONDITION_LABELS } from '@/types/dashboards/operations-overview-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CircularProgress } from '@/components/ui/circular-progress'

// Store Imports
import { useVehiclesStore } from '@/store/use-vehicles-store'

// Util Imports
import { getFleetConditionBreakdown } from '@/lib/selectors/operations-selectors'
import { cn } from '@/lib/utils'

type FleetConditionCardProps = {
  className?: string
}

const CONDITION_RING: Record<FleetConditionKey, string> = {
  excellent: 'stroke-green-600 dark:stroke-green-400',
  good: 'stroke-sky-600 dark:stroke-sky-400',
  due_soon: 'stroke-amber-600 dark:stroke-amber-400',
  overdue: 'stroke-destructive',
  in_service: 'stroke-muted-foreground'
}

const CONDITION_BADGE: Record<FleetConditionKey, string> = {
  excellent: 'bg-success-soft text-success',
  good: 'bg-info-soft text-info',
  due_soon: 'bg-warning-soft text-warning',
  overdue: 'bg-destructive/10 text-destructive',
  in_service: 'bg-muted text-muted-foreground'
}

const FleetConditionCard = ({ className }: FleetConditionCardProps) => {
  // Hooks
  const vehicles = useVehiclesStore(state => state.vehicles)

  // Vars
  const buckets = getFleetConditionBreakdown(vehicles)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg'>Fleet condition</CardTitle>
        <CardAction>
          <Button size='sm' variant='outline' render={<Link href='/fleet' />} nativeButton={false}>
            Fleet
            <ArrowRightIcon data-icon='inline-end' />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col justify-between gap-4'>
        {buckets.map(bucket => (
          <div key={bucket.condition} className='flex items-center justify-between gap-2'>
            <div className='flex min-w-0 items-center gap-3'>
              <CircularProgress
                value={bucket.percentage}
                size={52}
                strokeWidth={5}
                showLabel
                labelClassName='text-xs'
                progressClassName={CONDITION_RING[bucket.condition]}
                progressBgClassName='stroke-border'
                renderLabel={value => `${Math.round(value)}%`}
              />
              <div className='flex min-w-0 flex-col gap-0.5'>
                <span className='text-base font-medium'>{FLEET_CONDITION_LABELS[bucket.condition]}</span>
                <span className='text-muted-foreground truncate text-sm'>
                  {FLEET_CONDITION_DETAILS[bucket.condition]}
                </span>
              </div>
            </div>
            <Badge className={cn('h-6 shrink-0 rounded-sm px-3', CONDITION_BADGE[bucket.condition])}>
              {bucket.count}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default FleetConditionCard
