'use client'

// Third-party Imports
import { GaugeIcon } from 'lucide-react'

// Type Imports
import type { OperationsOverviewData } from '@/types/dashboards/operations-overview-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

// Store Imports
import { useVehiclesStore } from '@/store/use-vehicles-store'

// Util Imports
import { getDeliveryPerformance } from '@/lib/selectors/operations-selectors'
import { cn } from '@/lib/utils'

type DeliveryPerformanceCardProps = {
  data: OperationsOverviewData
  className?: string
}

const TOTAL_BARS = 10

type Grade = 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Critical'

const getGrade = (value: number): Grade => {
  if (value >= 90) return 'Excellent'
  if (value >= 70) return 'Good'
  if (value >= 50) return 'Average'
  if (value >= 30) return 'Poor'

  return 'Critical'
}

const GRADE_BADGE: Record<Grade, string> = {
  Excellent: 'bg-success-soft text-success',
  Good: 'bg-primary text-primary-foreground',
  Average: 'bg-warning-soft text-warning',
  Poor: 'bg-warning-soft text-warning',
  Critical: 'bg-destructive/10 text-destructive'
}

const DeliveryPerformanceCard = ({ data, className }: DeliveryPerformanceCardProps) => {
  // Hooks
  const vehicles = useVehiclesStore(state => state.vehicles)

  // Vars
  const { onTimeRate, routeCompletionRate } = getDeliveryPerformance(vehicles)
  const deliveredThisWeek = data.ordersTrend.reduce((sum, point) => sum + point.delivered, 0)

  const deltaBadgeClass =
    data.performanceChangePercent > 0
      ? 'bg-success-soft text-success'
      : data.performanceChangePercent < 0
        ? 'bg-destructive/10 text-destructive'
        : 'bg-muted text-muted-foreground'

  const metrics = [
    { title: 'On-time rate', value: onTimeRate, color: 'progress-primary' },
    { title: 'Route completion', value: routeCompletionRate, color: 'progress-success' }
  ]

  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <span className='bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-sm'>
            <GaugeIcon className='size-4' />
          </span>
          Delivery performance
        </CardTitle>
        <CardAction>
          <Badge className={cn('rounded-sm', deltaBadgeClass)}>
            {data.performanceChangePercent > 0 && '+'}
            {data.performanceChangePercent}%
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className='flex items-baseline gap-2'>
        <span className='text-2xl font-semibold'>{deliveredThisWeek.toLocaleString()}</span>
        <span className='text-muted-foreground text-sm'>delivered this week</span>
      </CardContent>

      <CardContent className='flex flex-1 flex-col gap-4'>
        <Separator />
        <div className='grid flex-1 grid-cols-2'>
          {metrics.map(metric => {
            const filledBars = Math.round((metric.value / 100) * TOTAL_BARS)
            const grade = getGrade(metric.value)

            return (
              <div key={metric.title} className='flex flex-1 flex-col gap-2.5 p-2'>
                <div className='flex flex-col gap-1'>
                  <span className='text-muted-foreground text-sm'>{metric.title}</span>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-2xl font-medium'>{metric.value}%</span>
                    <Badge className={cn('rounded-sm', GRADE_BADGE[grade])}>{grade}</Badge>
                  </div>
                </div>
                <div className='flex flex-1 flex-col justify-between gap-1.5'>
                  {Array.from({ length: TOTAL_BARS }, (_, index) => (
                    <Progress
                      key={index}
                      value={index >= TOTAL_BARS - filledBars ? 100 : 0}
                      className={cn(
                        '*:data-[slot=progress-track]:h-2 *:data-[slot=progress-track]:rounded-xs',
                        metric.color
                      )}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default DeliveryPerformanceCard
