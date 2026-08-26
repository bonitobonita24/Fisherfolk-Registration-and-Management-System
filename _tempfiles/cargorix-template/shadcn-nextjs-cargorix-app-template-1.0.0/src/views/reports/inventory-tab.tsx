'use client'

// Third-party Imports
import { ArchiveIcon, CalendarDaysIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'

// Type Imports
import type { CategoryStockHealth } from '@/types/dashboards/inventory-overview-types'
import type { InventoryReport } from '@/types/pages/reports-types'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import MetricCard from './metric-card'

// Util Imports
import { DAYS_ON_HAND_CAP } from '@/lib/selectors/reports-selectors'
import { cn } from '@/lib/utils'
import { formatNumber, formatPercent } from './format'

type InventoryTabProps = {
  report: InventoryReport
  categoryHealth: CategoryStockHealth[]
}

const healthTone = (percent: number) =>
  percent >= 70
    ? '[&_[data-slot=progress-indicator]]:bg-success'
    : percent >= 40
      ? '[&_[data-slot=progress-indicator]]:bg-warning'
      : '[&_[data-slot=progress-indicator]]:bg-destructive'

const healthText = (percent: number) =>
  percent >= 70 ? 'text-success' : percent >= 40 ? 'text-warning' : 'text-destructive'

const InventoryTab = ({ report, categoryHealth }: InventoryTabProps) => {
  // Vars
  const maxCategoryTurnover = report.byCategory[0]?.turnover ?? 0

  return (
    <div className='flex flex-col gap-6'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Turnover ratio'
          value={`${report.turnoverRatio}×`}
          icon={<RefreshCwIcon />}
          iconClassName='bg-info-soft text-info'
          caption={`${formatNumber(report.unitsSold)} units sold in period`}
        />
        <MetricCard
          label='Days on hand'
          value={formatNumber(report.daysOnHand)}
          unit='days'
          icon={<CalendarDaysIcon />}
          iconClassName='bg-info-soft text-info'
          caption='At the current turnover rate'
        />
        <MetricCard
          label='Dead stock'
          value={formatPercent(report.deadStockRate)}
          icon={<ArchiveIcon />}
          iconClassName='bg-warning-soft text-warning'
          valueClassName={report.deadStockRate > 0 ? 'text-warning' : undefined}
          caption={`${report.deadStockCount} of ${report.skuCount} SKUs had no sales`}
        />
        <MetricCard
          label='Low stock'
          value={formatPercent(report.lowStockRate)}
          icon={<TriangleAlertIcon />}
          iconClassName='bg-destructive/10 text-destructive'
          valueClassName={report.lowStockRate > 0 ? 'text-destructive' : undefined}
          caption={`${report.lowStockCount} SKUs at or below reorder point`}
        />
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card className='min-w-0'>
          <CardHeader className='flex flex-wrap items-center justify-between gap-2 border-b'>
            <CardTitle>Turnover by category</CardTitle>
            <span className='text-muted-foreground text-xs'>annualised</span>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            {report.byCategory.length === 0 ? (
              <p className='text-muted-foreground py-6 text-center text-sm'>No categories in this scope.</p>
            ) : (
              report.byCategory.map(category => (
                <div key={category.id}>
                  <div className='flex items-center justify-between gap-3'>
                    <span className='truncate text-sm font-medium'>{category.name}</span>
                    <span className='shrink-0 text-sm font-semibold tabular-nums'>{category.turnover}×</span>
                  </div>
                  <div className='mt-1.5 flex items-center gap-3'>
                    <Progress
                      value={maxCategoryTurnover === 0 ? 0 : (category.turnover / maxCategoryTurnover) * 100}
                      className='flex-1 **:data-[slot=progress-track]:h-1.5'
                    />
                    <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                      {formatNumber(category.unitsSold)} units
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className='min-w-0'>
          <CardHeader className='border-b'>
            <CardTitle>Slowest movers</CardTitle>
          </CardHeader>
          <CardContent className='px-0'>
            {report.slowestMovers.length === 0 ? (
              <p className='text-muted-foreground py-6 text-center text-sm'>No products in this scope.</p>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='pl-6'>Product</TableHead>
                      <TableHead className='text-right'>On hand</TableHead>
                      <TableHead className='text-right'>Days on hand</TableHead>
                      <TableHead className='pr-6 text-right'>Turnover</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.slowestMovers.map(product => (
                      <TableRow key={product.id}>
                        <TableCell className='pl-6'>
                          <p className='truncate text-sm font-medium' title={product.name}>
                            {product.name}
                          </p>
                          <p className='text-muted-foreground text-xs'>{product.sku}</p>
                        </TableCell>
                        <TableCell className='text-right text-sm tabular-nums'>
                          {formatNumber(product.onHand)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right text-sm font-semibold tabular-nums',
                            product.daysOnHand >= DAYS_ON_HAND_CAP ? 'text-destructive' : 'text-warning'
                          )}
                        >
                          {product.daysOnHand >= DAYS_ON_HAND_CAP ? `${DAYS_ON_HAND_CAP}+` : product.daysOnHand}
                        </TableCell>
                        <TableCell className='pr-6 text-right text-sm tabular-nums'>{product.turnover}×</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className='min-w-0'>
        <CardHeader className='border-b'>
          <CardTitle>Stock health by category</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3'>
          {categoryHealth.map(category => (
            <div key={category.id} className='min-w-0'>
              <div className='flex items-center justify-between gap-3'>
                <span className='truncate text-sm font-medium'>{category.name}</span>
                <span
                  className={cn('shrink-0 text-sm font-semibold tabular-nums', healthText(category.utilizationPercent))}
                >
                  {category.utilizationPercent}%
                </span>
              </div>
              <Progress
                value={category.utilizationPercent}
                className={cn('mt-2 **:data-[slot=progress-track]:h-1.5', healthTone(category.utilizationPercent))}
              />
              <p className='text-muted-foreground mt-1.5 text-xs'>
                {category.skuCount} SKUs · {category.value}
              </p>
            </div>
          ))}
        </CardContent>
        <CardContent className='border-t pt-4'>
          <p className='text-muted-foreground text-xs'>Percentage of SKUs above their reorder threshold</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default InventoryTab
