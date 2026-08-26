'use client'

// Third-party Imports
import { BanIcon, DollarSignIcon, ReceiptIcon, ShoppingCartIcon } from 'lucide-react'

// Type Imports
import type { ReportWindow, RevenueReport } from '@/types/pages/reports-types'

// Component Imports
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import MetricCard from './metric-card'
import RankedBarList from './ranked-bar-list'
import TrendChart from './trend-chart'

// Util Imports
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from './format'

type RevenueTabProps = {
  report: RevenueReport
  window: ReportWindow
  compare: boolean
  bucketLabel: string
}

const RevenueTab = ({ report, window, compare, bucketLabel }: RevenueTabProps) => {
  // Vars
  const comparisonLabel = compare ? window.previousLabel : undefined

  return (
    <div className='flex flex-col gap-6'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Revenue'
          value={formatCurrency(report.revenue)}
          icon={<DollarSignIcon />}
          iconClassName='bg-success-soft text-success'
          delta={compare ? report.revenueDelta : undefined}
          formatDelta={formatCurrency}
          comparisonLabel={comparisonLabel}
          caption='Excludes cancelled orders'
        />
        <MetricCard
          label='Avg order value'
          value={formatCurrency(report.avgOrderValue)}
          icon={<ReceiptIcon />}
          iconClassName='bg-info-soft text-info'
          delta={compare ? report.avgOrderValueDelta : undefined}
          formatDelta={formatCurrency}
          comparisonLabel={comparisonLabel}
          caption='Revenue per billable order'
        />
        <MetricCard
          label='Orders'
          value={formatNumber(report.orderCount)}
          icon={<ShoppingCartIcon />}
          iconClassName='bg-info-soft text-info'
          delta={compare ? report.orderCountDelta : undefined}
          comparisonLabel={comparisonLabel}
          caption='Billable orders booked'
        />
        <MetricCard
          label='Cancellation rate'
          value={formatPercent(report.cancellationRate)}
          icon={<BanIcon />}
          iconClassName='bg-warning-soft text-warning'
          valueClassName={report.cancellationRate > 0 ? 'text-warning' : undefined}
          delta={compare ? report.cancellationDelta : undefined}
          deltaSuffix=' pt'
          comparisonLabel={comparisonLabel}
          caption='Cancelled share of all orders'
        />
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        <div className='min-w-0 xl:col-span-2'>
          <TrendChart
            title='Revenue trend'
            caption={bucketLabel}
            data={report.trend}
            compare={compare}
            currentLabel='Current period'
            previousLabel='Previous period'
            formatValue={formatCompactCurrency}
            emptyTitle='No revenue in this period'
            emptyDescription='Widen the date range or clear the service level filter.'
            emptyIcon={<DollarSignIcon />}
          />
        </div>

        <div className='grid min-w-0 grid-cols-1 gap-6 lg:max-xl:grid-cols-2'>
          <Card className='min-w-0'>
            <CardHeader className='border-b'>
              <CardTitle>Top clients by revenue</CardTitle>
            </CardHeader>
            <CardContent className='px-0'>
              {report.topClients.length === 0 ? (
                <p className='text-muted-foreground py-6 text-center text-sm'>No client revenue in this period.</p>
              ) : (
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-12 pl-6'>#</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className='pr-6 text-right'>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topClients.map(client => (
                        <TableRow key={client.id}>
                          <TableCell className='text-muted-foreground pl-6 tabular-nums'>{client.rank}</TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2.5'>
                              <Avatar className='size-7'>
                                <AvatarFallback className='text-xs'>{client.initials}</AvatarFallback>
                              </Avatar>
                              <div className='min-w-0'>
                                <p className='truncate text-sm font-medium' title={client.name}>
                                  {client.name}
                                </p>
                                <p className='text-muted-foreground text-xs'>{client.orders} orders</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='pr-6 text-right text-sm font-semibold tabular-nums'>
                            {formatCurrency(client.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='min-w-0'>
            <CardHeader className='border-b'>
              <CardTitle>Revenue by service level</CardTitle>
            </CardHeader>
            <CardContent>
              <RankedBarList
                rows={report.byServiceLevel}
                formatValue={row => formatCurrency(row.value)}
                emptyLabel='No revenue in this period.'
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RevenueTab
