// Third-party Imports
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { ChevronDownIcon } from 'lucide-react'

// Type Imports
import type { ChartConfig } from '@/components/ui/chart'
import type { Product } from '@/types/entities/product'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'

type SalesPerformanceCardProps = {
  product: Product
}

const chartConfig = {
  sold: {
    label: 'Units Sold',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig

const SalesPerformanceCard = ({ product }: SalesPerformanceCardProps) => {
  // Vars
  const soldSum = product.salesTrend.reduce((total, point) => total + point.sold, 0)
  const revenueSum = product.salesTrend.reduce((total, point) => total + point.revenue, 0)
  const avgDailySales = product.salesTrend.length > 0 ? soldSum / product.salesTrend.length : 0

  const stats: { label: string; value: string }[] = [
    { label: 'Sold', value: soldSum.toString() },
    { label: 'Revenue', value: `$${revenueSum.toFixed(2)}` },
    { label: 'Avg. daily sales', value: avgDailySales.toFixed(1) }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales performance</CardTitle>
        <CardAction>
          <Button variant='outline' size='sm'>
            Last 30 days
            <ChevronDownIcon data-icon='inline-end' />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-3 gap-4'>
          {stats.map(stat => (
            <div key={stat.label} className='space-y-1'>
              <p className='text-muted-foreground text-sm'>{stat.label}</p>
              <p className='text-2xl font-semibold'>{stat.value}</p>
            </div>
          ))}
        </div>
        <ChartContainer config={chartConfig} className='h-72 w-full'>
          <AreaChart accessibilityLayer data={product.salesTrend}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey='date' tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent indicator='dot' />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey='sold'
              type='monotone'
              fill='var(--color-sold)'
              fillOpacity={0.2}
              stroke='var(--color-sold)'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default SalesPerformanceCard
