// Third-party Imports
import { BarChart3Icon, CalendarIcon, CircleCheckIcon, TrendingUpIcon } from 'lucide-react'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'

type Props = {
  stats: {
    totalSold: number
    returns: number
    lowStock: boolean
    daysOfStock: number
  }
}

const QuickStatsCard = ({ stats }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <BarChart3Icon className='text-muted-foreground size-4' />
          Quick stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-3'>
          <div className='rounded-lg border p-3'>
            <p className='text-muted-foreground text-xs'>Total sold this month</p>
            <div className='mt-1 flex items-center justify-between gap-2'>
              <span className='text-xl font-bold tabular-nums'>{stats.totalSold}</span>
              <TrendingUpIcon className='text-muted-foreground size-4 shrink-0' />
            </div>
          </div>
          <div className='rounded-lg border p-3'>
            <p className='text-muted-foreground text-xs'>Returns this month</p>
            <div className='mt-1 flex items-center justify-between gap-2'>
              <span className='text-xl font-bold tabular-nums'>{stats.returns}</span>
              <TrendingUpIcon className='text-muted-foreground size-4 shrink-0' />
            </div>
          </div>
          <div className='rounded-lg border p-3'>
            <p className='text-muted-foreground text-xs'>Low stock alert</p>
            <div className='mt-1 flex items-center justify-between gap-2'>
              <span className={cn('text-xl font-bold tabular-nums', stats.lowStock && 'text-warning')}>
                {stats.lowStock ? 'Yes' : 'No'}
              </span>
              <CircleCheckIcon className={cn('size-4 shrink-0', stats.lowStock ? 'text-warning' : 'text-success')} />
            </div>
          </div>
          <div className='rounded-lg border p-3'>
            <p className='text-muted-foreground text-xs'>Days of stock left</p>
            <div className='mt-1 flex items-center justify-between gap-2'>
              <span className='text-xl font-bold tabular-nums'>{stats.daysOfStock}</span>
              <CalendarIcon className='text-muted-foreground size-4 shrink-0' />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default QuickStatsCard
