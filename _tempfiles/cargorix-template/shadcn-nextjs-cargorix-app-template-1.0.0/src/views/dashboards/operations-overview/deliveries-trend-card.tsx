'use client'

// Third-party Imports
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import { Line, LineChart, XAxis } from 'recharts'

// Type Imports
import type { ChartConfig } from '@/components/ui/chart'
import type { OperationsOverviewData } from '@/types/dashboards/operations-overview-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'

// Util Imports
import { cn } from '@/lib/utils'

type DeliveriesTrendCardProps = {
  data: OperationsOverviewData
  className?: string
}

const chartConfig = {
  orders: {
    label: 'Orders placed',
    color: 'var(--muted-foreground)'
  },
  delivered: {
    label: 'Delivered',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig

const DeliveriesTrendCard = ({ data, className }: DeliveriesTrendCardProps) => {
  // Vars
  const deliveredThisWeek = data.ordersTrend.reduce((sum, point) => sum + point.delivered, 0)
  const isUp = data.deliveredChangePercent >= 0
  const TrendIcon = isUp ? TrendingUpIcon : TrendingDownIcon

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg'>Deliveries trend</CardTitle>
        <CardAction>
          <Badge
            className={cn('rounded-sm', isUp ? 'bg-success-soft text-success' : 'bg-destructive/10 text-destructive')}
          >
            <TrendIcon data-icon='inline-start' />
            {isUp && '+'}
            {data.deliveredChangePercent}%
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-6'>
        <div className='flex flex-col gap-1'>
          <span className='text-3xl font-semibold'>{deliveredThisWeek.toLocaleString()}</span>
          <span className='text-muted-foreground text-sm'>Delivered over the last 7 days</span>
        </div>

        <ChartContainer config={chartConfig} className='min-h-47.5 w-full flex-1'>
          <LineChart accessibilityLayer data={data.ordersTrend} margin={{ left: 12, right: 12, top: 8 }}>
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 14, fill: 'var(--muted-foreground)' }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dot' />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey='orders'
              type='monotone'
              stroke='var(--color-orders)'
              strokeWidth={2}
              strokeDasharray='6 6'
              dot={false}
            />
            <Line
              dataKey='delivered'
              type='bump'
              stroke='var(--color-delivered)'
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default DeliveriesTrendCard
