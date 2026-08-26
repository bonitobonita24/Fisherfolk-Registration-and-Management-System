'use client'

// Third-party Imports
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from 'recharts'

// Type Imports
import type { AxisDomain } from 'recharts/types/util/types'

import type { ChartConfig } from '@/components/ui/chart'
import type { TrendPoint } from '@/types/pages/reports-types'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

type TrendChartProps = {
  title: string
  caption: string
  data: TrendPoint[]
  compare: boolean
  currentLabel: string
  previousLabel: string
  formatValue: (value: number) => string

  domain?: AxisDomain
  emptyTitle: string
  emptyDescription: string
  emptyIcon: React.ReactNode
}

const TrendChart = ({
  title,
  caption,
  data,
  compare,
  currentLabel,
  previousLabel,
  formatValue,
  domain = [0, 'auto'],
  emptyTitle,
  emptyDescription,
  emptyIcon
}: TrendChartProps) => {
  // Vars
  const config = {
    current: { label: currentLabel, color: 'var(--chart-3)' },
    previous: { label: previousLabel, color: 'var(--chart-2)' }
  } satisfies ChartConfig

  const hasData = data.some(point => point.current > 0 || (point.previous ?? 0) > 0)

  return (
    <Card className='min-w-0'>
      <CardHeader className='flex flex-wrap items-center justify-between gap-2 border-b'>
        <CardTitle>{title}</CardTitle>
        <span className='text-muted-foreground text-xs'>{caption}</span>
      </CardHeader>
      <CardContent className='min-w-0'>
        {hasData ? (
          <>
            <ChartContainer config={config} className='h-75 w-full'>
              <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 12, top: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray='3 3' />
                <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={10} interval='preserveStartEnd' />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={56}
                  domain={domain}
                  tickFormatter={value => formatValue(Number(value))}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator='dot' formatter={value => formatValue(Number(value))} />}
                />
                <Area
                  dataKey='current'
                  type='monotone'
                  fill='var(--color-current)'
                  fillOpacity={0.15}
                  stroke='var(--color-current)'
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
                {compare && (
                  <Line
                    dataKey='previous'
                    type='monotone'
                    stroke='var(--color-previous)'
                    strokeWidth={2}
                    strokeDasharray='5 4'
                    dot={{ r: 2.5 }}
                    activeDot={{ r: 4 }}
                  />
                )}
              </AreaChart>
            </ChartContainer>

            <div className='text-muted-foreground mt-4 flex flex-wrap items-center justify-center gap-6 text-xs'>
              <span className='inline-flex items-center gap-2'>
                <span className='h-0.5 w-5 rounded-full' style={{ backgroundColor: 'var(--chart-3)' }} />
                {currentLabel}
              </span>
              {compare && (
                <span className='inline-flex items-center gap-2'>
                  <span
                    className='h-0.5 w-5 rounded-full opacity-70'
                    style={{
                      backgroundImage: 'repeating-linear-gradient(to right, var(--chart-2) 0 5px, transparent 5px 9px)'
                    }}
                  />
                  {previousLabel}
                </span>
              )}
            </div>
          </>
        ) : (
          <Empty className='h-75'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>{emptyIcon}</EmptyMedia>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}

export default TrendChart
