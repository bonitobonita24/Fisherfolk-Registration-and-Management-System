'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChartColumnIcon, ChevronRightIcon, MapPinnedIcon, RouteIcon, WrenchIcon } from 'lucide-react'

// Type Imports
import type { FleetReport, ReportWindow } from '@/types/pages/reports-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import MetricCard from './metric-card'
import TrendChart from './trend-chart'

// Util Imports
import { cn } from '@/lib/utils'
import { formatNumber, formatPercent } from './format'

type FleetTabProps = {
  report: FleetReport
  window: ReportWindow
  compare: boolean
  bucketLabel: string
  utilizationCaption: string
}

const TONE_DOT = {
  destructive: 'bg-destructive',
  warning: 'bg-warning',
  info: 'bg-info'
} as const

const TONE_BAR = {
  destructive: '[&_[data-slot=progress-indicator]]:bg-destructive',
  warning: '[&_[data-slot=progress-indicator]]:bg-warning',
  info: '[&_[data-slot=progress-indicator]]:bg-info'
} as const

const FleetTab = ({ report, window, compare, bucketLabel, utilizationCaption }: FleetTabProps) => {
  // Vars
  const comparisonLabel = compare ? window.previousLabel : undefined
  const maxMaintenance = Math.max(1, ...report.maintenance.map(row => row.count))

  return (
    <div className='flex flex-col gap-6'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Fleet utilisation'
          value={formatPercent(report.utilization)}
          icon={<ChartColumnIcon />}
          iconClassName='bg-info-soft text-info'
          delta={compare ? report.utilizationDelta : undefined}
          deltaSuffix=' pt'
          comparisonLabel={comparisonLabel}
          caption={utilizationCaption}
        />
        <MetricCard
          label='Avg stops per route'
          value={String(report.avgStopsPerRoute)}
          icon={<MapPinnedIcon />}
          iconClassName='bg-info-soft text-info'
          caption='Across all committed routes'
        />
        <MetricCard
          label='Avg trip distance'
          value={String(report.avgRouteDistanceKm)}
          unit='km'
          icon={<RouteIcon />}
          iconClassName='bg-info-soft text-info'
          delta={compare ? report.avgRouteDistanceDelta : undefined}
          deltaSuffix=' km'
          comparisonLabel={comparisonLabel}
          caption='Per dispatched shipment'
        />
        <MetricCard
          label='Vehicles engaged'
          value={`${report.activeVehicles}/${report.fleetSize}`}
          icon={<WrenchIcon />}
          iconClassName='bg-success-soft text-success'
          caption={`${report.overdueCount} unavailable for dispatch`}
        />
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        <div className='min-w-0 xl:col-span-2'>
          <TrendChart
            title='Utilisation trend'
            caption={bucketLabel}
            data={report.trend}
            compare={compare}
            currentLabel='Current period'
            previousLabel='Previous period'
            formatValue={value => `${Math.round(value)}%`}
            domain={[0, (dataMax: number) => Math.min(100, Math.ceil(dataMax / 10) * 10 + 10)]}
            emptyTitle='No vehicle activity in this period'
            emptyDescription='Widen the date range or clear the vehicle type filter.'
            emptyIcon={<ChartColumnIcon />}
          />
        </div>

        <div className='grid min-w-0 grid-cols-1 gap-6 md:max-xl:grid-cols-2'>
          <Card className='min-w-0'>
            <CardHeader className='border-b'>
              <CardTitle>Top vehicles</CardTitle>
            </CardHeader>
            <CardContent className='px-0'>
              {report.topVehicles.length === 0 ? (
                <p className='text-muted-foreground py-6 text-center text-sm'>No vehicle activity in this period.</p>
              ) : (
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-12 pl-6'>#</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead className='pr-6 text-right'>Utilisation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topVehicles.map(vehicle => (
                        <TableRow key={vehicle.id}>
                          <TableCell className='text-muted-foreground pl-6 tabular-nums'>{vehicle.rank}</TableCell>
                          <TableCell>
                            <p className='truncate text-sm font-medium'>{vehicle.label}</p>
                            <p className='text-muted-foreground text-xs'>
                              {vehicle.typeLabel} · {vehicle.trips} trips
                            </p>
                          </TableCell>
                          <TableCell
                            className={cn(
                              'pr-6 text-right text-sm font-semibold tabular-nums',
                              vehicle.utilization >= 70 ? 'text-success' : 'text-warning'
                            )}
                          >
                            {formatPercent(vehicle.utilization, 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardContent className='border-t pt-4'>
              <Button
                size='sm'
                variant='link'
                className='h-auto gap-1 px-0'
                render={<Link href='/fleet' />}
                nativeButton={false}
              >
                View all vehicles
                <ChevronRightIcon data-icon='inline-end' />
              </Button>
            </CardContent>
          </Card>

          <Card className='min-w-0'>
            <CardHeader className='border-b'>
              <CardTitle>Fleet readiness</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
              {report.maintenance.map(row => (
                <div key={row.id}>
                  <div className='flex items-center justify-between gap-3'>
                    <span className='inline-flex min-w-0 items-center gap-2'>
                      <span className={cn('size-2 shrink-0 rounded-full', TONE_DOT[row.tone])} />
                      <span className='truncate text-sm font-medium'>{row.label}</span>
                    </span>
                    <span className='shrink-0 text-sm font-semibold tabular-nums'>{formatNumber(row.count)}</span>
                  </div>
                  <Progress
                    value={(row.count / maxMaintenance) * 100}
                    className={cn('mt-1.5 **:data-[slot=progress-track]:h-1.5', TONE_BAR[row.tone])}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default FleetTab
