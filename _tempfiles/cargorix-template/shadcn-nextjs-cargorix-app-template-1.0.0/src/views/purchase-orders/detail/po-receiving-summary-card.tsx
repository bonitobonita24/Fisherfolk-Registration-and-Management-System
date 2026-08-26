'use client'

// Third-party Imports
import { Cell, Pie, PieChart } from 'recharts'

// Type Imports
import type { ChartConfig } from '@/components/ui/chart'
import type { PurchaseOrder } from '@/types/entities/purchase-order'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'

// Util Imports
import { computeReceivingProgress } from '@/lib/selectors/purchase-orders-selectors'

const receivingChartConfig = {
  received: { label: 'Received', color: 'var(--color-green-600)' },
  remaining: { label: 'Remaining', color: 'var(--color-amber-600)' }
} satisfies ChartConfig

type PoReceivingSummaryCardProps = {
  po: PurchaseOrder
}

const PoReceivingSummaryCard = ({ po }: PoReceivingSummaryCardProps) => {
  // Vars
  const progress = computeReceivingProgress(po)

  const chartData = [
    {
      key: 'received',
      label: 'Received',
      value: progress.totalReceived,
      fill: receivingChartConfig.received.color
    },
    {
      key: 'remaining',
      label: 'Remaining',
      value: progress.totalRemaining,
      fill: receivingChartConfig.remaining.color
    }
  ]

  const rows = [
    { label: 'Ordered', value: progress.totalOrdered },
    { label: 'Received', value: progress.totalReceived },
    { label: 'Remaining', value: progress.totalRemaining }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receiving summary</CardTitle>
        <CardDescription>Units received against this PO</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='relative mx-auto aspect-square w-36'>
          <ChartContainer config={receivingChartConfig} className='mx-auto aspect-square h-full w-full'>
            <PieChart>
              <Pie
                data={chartData}
                dataKey='value'
                nameKey='label'
                innerRadius={44}
                outerRadius={64}
                paddingAngle={2}
                strokeWidth={4}
              >
                {chartData.map(entry => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
            <span className='text-3xl font-semibold'>{progress.receivedPercent}%</span>
            <span className='text-muted-foreground mt-1 text-xs'>received</span>
          </div>
        </div>

        <div className='space-y-2'>
          {rows.map(row => (
            <div key={row.label} className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>{row.label}</span>
              <span className='font-medium tabular-nums'>{row.value}</span>
            </div>
          ))}
        </div>

        <p className='text-muted-foreground text-xs'>Received quantities create receipt ledger entries.</p>
      </CardContent>
    </Card>
  )
}

export default PoReceivingSummaryCard
