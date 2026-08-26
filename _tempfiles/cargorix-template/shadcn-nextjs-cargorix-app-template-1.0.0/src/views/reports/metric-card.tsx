// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'

// Type Imports
import type { MetricDelta } from '@/types/pages/reports-types'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'

// Util Imports
import { isDeltaPositive } from '@/lib/selectors/reports-selectors'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: string
  unit?: string
  caption?: string
  icon: ReactNode
  iconClassName?: string
  valueClassName?: string
  delta?: MetricDelta
  deltaSuffix?: string

  formatDelta?: (value: number) => string
  comparisonLabel?: string
}

const MetricCard = ({
  label,
  value,
  unit,
  caption,
  icon,
  iconClassName,
  valueClassName,
  delta,
  deltaSuffix = '',
  formatDelta,
  comparisonLabel
}: MetricCardProps) => {
  // Vars
  const positive = delta ? isDeltaPositive(delta) : true

  const DeltaIcon =
    delta?.direction === 'up' ? TrendingUpIcon : delta?.direction === 'down' ? TrendingDownIcon : MinusIcon

  return (
    <Card size='sm'>
      <CardContent className='flex flex-col gap-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-muted-foreground text-sm font-medium'>{label}</p>
            <p className='mt-1 flex items-baseline gap-1.5'>
              <span className={cn('truncate text-3xl font-bold tabular-nums', valueClassName)}>{value}</span>
              {unit && <span className='text-muted-foreground text-sm font-medium'>{unit}</span>}
            </p>
          </div>
          <span
            className={cn(
              'bg-accent text-accent-foreground grid size-10 shrink-0 place-items-center rounded-xl [&>svg]:size-5',
              iconClassName
            )}
          >
            {icon}
          </span>
        </div>

        {delta ? (
          <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
            <span
              className={cn(
                'inline-flex items-center gap-1 font-semibold',
                delta.direction === 'flat' ? 'text-muted-foreground' : positive ? 'text-success' : 'text-destructive'
              )}
            >
              <DeltaIcon className='size-3.5' />
              {delta.direction === 'flat'
                ? 'No change'
                : `${formatDelta ? formatDelta(delta.value) : delta.value}${deltaSuffix}`}
            </span>
            {comparisonLabel && <span className='text-muted-foreground truncate'>vs {comparisonLabel}</span>}
          </div>
        ) : (
          caption && <p className='text-muted-foreground truncate text-xs'>{caption}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default MetricCard
