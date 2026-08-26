'use client'

// Third-party Imports
import { CircleAlertIcon, ClockIcon, RouteIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { DeliveryReport, ReportWindow } from '@/types/pages/reports-types'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MetricCard from './metric-card'
import RankedBarList from './ranked-bar-list'
import TrendChart from './trend-chart'

// Util Imports
import { formatNumber, formatPercent } from './format'

type DeliveryTabProps = {
  report: DeliveryReport
  window: ReportWindow
  compare: boolean
  bucketLabel: string
}

const DeliveryTab = ({ report, window, compare, bucketLabel }: DeliveryTabProps) => {
  // Vars
  const comparisonLabel = compare ? window.previousLabel : undefined

  return (
    <div className='flex flex-col gap-6'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='On-time rate'
          value={formatPercent(report.onTimeRate)}
          icon={<TruckIcon />}
          iconClassName='bg-success-soft text-success'
          delta={compare ? report.onTimeDelta : undefined}
          deltaSuffix=' pt'
          comparisonLabel={comparisonLabel}
          caption={`${formatNumber(report.deliveredCount)} deliveries completed`}
        />
        <MetricCard
          label='Avg delivery time'
          value={String(report.avgDeliveryDays)}
          unit='days'
          icon={<ClockIcon />}
          iconClassName='bg-info-soft text-info'
          delta={compare ? report.avgDeliveryDelta : undefined}
          deltaSuffix=' days'
          comparisonLabel={comparisonLabel}
          caption='Order booked to proof of delivery'
        />
        <MetricCard
          label='Avg distance'
          value={String(report.avgDistanceKm)}
          unit='km'
          icon={<RouteIcon />}
          iconClassName='bg-info-soft text-info'
          delta={compare ? report.avgDistanceDelta : undefined}
          deltaSuffix=' km'
          comparisonLabel={comparisonLabel}
          caption='Per completed shipment'
        />
        <MetricCard
          label='Failed deliveries'
          value={formatPercent(report.failureRate)}
          icon={<CircleAlertIcon />}
          iconClassName='bg-destructive/10 text-destructive'
          valueClassName={report.failureRate > 0 ? 'text-destructive' : undefined}
          delta={compare ? report.failureDelta : undefined}
          deltaSuffix=' pt'
          comparisonLabel={comparisonLabel}
          caption='Returned to hub'
        />
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        <div className='min-w-0 xl:col-span-2'>
          <TrendChart
            title='On-time delivery trend'
            caption={bucketLabel}
            data={report.trend}
            compare={compare}
            currentLabel='Current period'
            previousLabel='Previous period'
            formatValue={value => `${Math.round(value)}%`}
            domain={[(dataMin: number) => Math.max(0, Math.floor(dataMin / 10) * 10 - 10), 100]}
            emptyTitle='No deliveries in this period'
            emptyDescription='Widen the date range or clear the carrier filter to see the trend.'
            emptyIcon={<TruckIcon />}
          />
        </div>

        <div className='grid min-w-0 grid-cols-1 gap-6 md:max-xl:grid-cols-2'>
          <Card className='min-w-0'>
            <CardHeader className='border-b'>
              <CardTitle>By carrier</CardTitle>
            </CardHeader>
            <CardContent>
              <RankedBarList
                rows={report.byCarrier}
                showRank
                formatValue={row => formatPercent(row.value, 0)}
                emptyLabel='No carrier activity in this period.'
              />
            </CardContent>
          </Card>

          <Card className='min-w-0'>
            <CardHeader className='border-b'>
              <CardTitle>Failure reasons</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
              <RankedBarList
                rows={report.failureReasons}
                formatValue={row => formatPercent(row.percent, 0)}
                emptyLabel='No failed deliveries in this period.'
                barClassName='[&_[data-slot=progress-indicator]]:bg-destructive'
              />
              {report.failureReasons.length > 0 && (
                <p className='text-muted-foreground text-xs'>% of failed deliveries</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DeliveryTab
