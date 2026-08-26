'use client'

// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import { Area, AreaChart, YAxis } from 'recharts'
import { BoxIcon, CircleAlertIcon, DollarSignIcon, PackageXIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'

// Type Imports
import type { ChartConfig } from '@/components/ui/chart'
import { INVENTORY_COMPARISON_LABELS } from '@/types/dashboards/inventory-overview-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

// Store Imports
import { useInventoryOverviewStore } from '@/store/use-inventory-overview-store'

const sparklineConfig = {
  value: {
    label: 'Inventory value',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig

type KpiShellProps = {
  icon: ReactNode
  label: string
  value: ReactNode
  children: ReactNode
}

const KpiShell = ({ icon, label, value, children }: KpiShellProps) => (
  <Card className='justify-between gap-4'>
    <CardContent className='flex items-center gap-4'>
      <span className='bg-muted text-foreground grid size-12 shrink-0 place-items-center rounded-full [&>svg]:size-5'>
        {icon}
      </span>
      <div className='min-w-0 flex-1'>
        <p className='text-muted-foreground text-sm font-medium'>{label}</p>
        <div className='mt-0.5 flex items-center gap-2'>{value}</div>
      </div>
    </CardContent>
    <CardContent>{children}</CardContent>
  </Card>
)

const InventoryKpiCards = () => {
  const data = useInventoryOverviewStore(state => state.data)
  const selectedRange = useInventoryOverviewStore(state => state.selectedRange)

  const summary = data.kpiSummaryByRange[selectedRange]
  const sparklineData = summary.inventoryValue.sparkline.map((value, index) => ({ index, value }))
  const TrendIcon = summary.inventoryValue.trend === 'up' ? TrendingUpIcon : TrendingDownIcon

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      <KpiShell
        icon={<BoxIcon />}
        label='Total SKUs'
        value={<span className='text-2xl font-semibold tabular-nums'>{summary.totalSkus.value.toLocaleString()}</span>}
      >
        <Separator className='mb-4' />
        <p className='text-muted-foreground text-xs'>
          +{summary.totalSkus.addedInPeriod} added · {summary.totalSkus.warehouseCount} warehouses
        </p>
      </KpiShell>

      <KpiShell
        icon={<DollarSignIcon />}
        label='Inventory Value'
        value={
          <>
            <span className='text-2xl font-semibold tabular-nums'>{summary.inventoryValue.value}</span>
            <Badge variant={summary.inventoryValue.trend === 'up' ? 'default' : 'destructive'}>
              <TrendIcon data-icon='inline-start' />
              {summary.inventoryValue.changePercent > 0 ? '+' : ''}
              {summary.inventoryValue.changePercent}%
            </Badge>
          </>
        }
      >
        <div className='flex items-center gap-3'>
          <span className='text-muted-foreground shrink-0 text-xs'>
            vs previous {INVENTORY_COMPARISON_LABELS[selectedRange]}
          </span>
          <ChartContainer config={sparklineConfig} className='h-9 min-w-0 flex-1'>
            <AreaChart data={sparklineData} margin={{ top: 2, left: 0, right: 0, bottom: 0 }}>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Area
                dataKey='value'
                type='monotone'
                fill='var(--color-value)'
                fillOpacity={0.2}
                stroke='var(--color-value)'
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </KpiShell>

      <KpiShell
        icon={<CircleAlertIcon />}
        label='Low Stock'
        value={<span className='text-warning text-2xl font-semibold tabular-nums'>{summary.lowStock.count}</span>}
      >
        <p className='text-muted-foreground text-xs'>{summary.lowStock.urgentCount} urgent at risk</p>
        <Progress value={summary.lowStock.utilizationPercent} className='mt-3' />
      </KpiShell>

      <KpiShell
        icon={<PackageXIcon />}
        label='Out of Stock'
        value={<span className='text-destructive text-2xl font-semibold tabular-nums'>{summary.outOfStock.count}</span>}
      >
        <div className='flex items-center justify-between gap-2 text-xs'>
          <span className='text-muted-foreground'>Est. revenue at risk</span>
          <span className='text-destructive font-semibold tabular-nums'>{summary.outOfStock.revenueAtRisk}</span>
        </div>
      </KpiShell>
    </div>
  )
}

export default InventoryKpiCards
