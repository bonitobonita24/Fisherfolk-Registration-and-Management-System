'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { CircleHelpIcon, TrendingUpIcon } from 'lucide-react'

// Type Imports
import type { ChartConfig } from '@/components/ui/chart'
import type { TurnoverPeriod } from '@/types/dashboards/inventory-overview-types'
import { TURNOVER_PERIOD_LABELS, TURNOVER_PERIOD_LIST } from '@/types/dashboards/inventory-overview-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Store Imports
import { useInventoryOverviewStore } from '@/store/use-inventory-overview-store'

const DEFAULT_PERIOD: TurnoverPeriod = '30d'

const turnoverChartConfig = {
  turnover: {
    label: 'Turnover',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig

const InventoryTurnoverCard = () => {
  const [period, setPeriod] = useState<TurnoverPeriod>(DEFAULT_PERIOD)

  const data = useInventoryOverviewStore(state => state.data)

  const turnoverData = data.turnoverByPeriod[period]
  const stats = data.turnoverStats

  return (
    <Card className='h-full'>
      <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <div className='flex items-center gap-1.5'>
            <CardTitle>Inventory Turnover</CardTitle>
            <Tooltip>
              <TooltipTrigger
                render={<span className='text-muted-foreground hover:text-foreground cursor-help' />}
                aria-label='About inventory turnover'
              >
                <CircleHelpIcon className='size-4' />
              </TooltipTrigger>
              <TooltipContent>How many times stock is sold and replaced over the period.</TooltipContent>
            </Tooltip>
          </div>
          <CardDescription className='mt-1'>Average inventory turns over the selected period</CardDescription>
        </div>

        <Tabs
          value={period}
          onValueChange={value => {
            if (value) setPeriod(value as TurnoverPeriod)
          }}
        >
          <TabsList>
            {TURNOVER_PERIOD_LIST.map(item => (
              <TabsTrigger key={item} value={item}>
                {TURNOVER_PERIOD_LABELS[item]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className='grid flex-1 grid-cols-1 gap-6'>
        <div className='bg-muted h-fit rounded-2xl p-4'>
          <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>Average turnover</p>
          <div className='mt-3 flex items-end gap-2'>
            <span className='text-4xl font-semibold tracking-tight'>{stats.averageTurnover}x</span>
            <Badge variant='default' className='mb-1'>
              <TrendingUpIcon data-icon='inline-start' />
              {stats.averageChange}x
            </Badge>
          </div>
          <p className='text-muted-foreground mt-2 text-xs leading-5'>
            Stock is moving faster than the previous period.
          </p>

          <Separator className='my-4' />

          <p className='text-muted-foreground text-xs'>Best category</p>
          <div className='mt-1 flex items-center justify-between gap-2'>
            <span className='truncate text-sm font-semibold'>{stats.bestCategory.name}</span>
            <span className='text-sm font-semibold tabular-nums'>{stats.bestCategory.turnover}x</span>
          </div>

          <Separator className='my-4' />

          <p className='text-muted-foreground text-xs'>Slowest category</p>
          <div className='mt-1 flex items-center justify-between gap-2'>
            <span className='truncate text-sm font-semibold'>{stats.slowestCategory.name}</span>
            <span className='text-sm font-semibold tabular-nums'>{stats.slowestCategory.turnover}x</span>
          </div>
        </div>

        <ChartContainer config={turnoverChartConfig} className='h-full min-h-70 w-full'>
          <AreaChart accessibilityLayer data={turnoverData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey='date' tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
              allowDecimals={false}
              tickFormatter={value => `${value}x`}
              domain={[0, (dataMax: number) => Math.ceil(dataMax / 2) * 2]}
            />
            <ChartTooltip content={<ChartTooltipContent indicator='dot' />} />
            <Area
              dataKey='turnover'
              type='monotone'
              fill='var(--color-turnover)'
              fillOpacity={0.2}
              stroke='var(--color-turnover)'
              strokeWidth={2.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default InventoryTurnoverCard
