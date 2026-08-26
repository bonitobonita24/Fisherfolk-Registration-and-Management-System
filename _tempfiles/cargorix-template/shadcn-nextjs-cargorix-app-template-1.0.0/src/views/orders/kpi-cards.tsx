'use client'

// Third-party Imports
import { Area, AreaChart } from 'recharts'
import { CheckCircle2Icon, ClipboardClockIcon, PackageCheckIcon, RouteIcon } from 'lucide-react'

// Type Imports
import type { ChartConfig } from '@/components/ui/chart'
import type { OrderKpiKey, OrderKpiTrends } from '@/types/pages/orders-types'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'

// Util Imports
import { getOrderKpis } from '@/lib/selectors/orders-selectors'

type KpiStyle = {
  label: string
  icon: typeof RouteIcon
  color: string
  iconClassName: string
}

const KPI_STYLES: Record<OrderKpiKey, KpiStyle> = {
  pendingReview: {
    label: 'Pending review',
    icon: ClipboardClockIcon,
    color: 'var(--color-amber-600)',
    iconClassName: 'bg-warning-soft text-warning'
  },
  readyForShipment: {
    label: 'Ready for shipment',
    icon: PackageCheckIcon,
    color: 'var(--color-primary)',
    iconClassName: 'bg-accent text-accent-foreground'
  },
  inFulfilment: {
    label: 'In fulfilment',
    icon: RouteIcon,
    color: 'var(--color-sky-600)',
    iconClassName: 'bg-info-soft text-info'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2Icon,
    color: 'var(--color-green-600)',
    iconClassName: 'bg-success-soft text-success'
  }
}

const KPI_ORDER: OrderKpiKey[] = ['pendingReview', 'readyForShipment', 'inFulfilment', 'completed']

type OrdersKpiCardsProps = {
  trends: OrderKpiTrends
}

const OrdersKpiCards = ({ trends }: OrdersKpiCardsProps) => {
  // Vars
  const orders = useOrdersStore(state => state.orders)
  const kpis = getOrderKpis(orders)

  const values: Record<OrderKpiKey, number> = {
    pendingReview: kpis.pendingReview,
    readyForShipment: kpis.readyForShipment,
    inFulfilment: kpis.inFulfilment,
    completed: kpis.completedThisMonth
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {KPI_ORDER.map(key => {
        const style = KPI_STYLES[key]
        const chartConfig = { value: { label: style.label } } satisfies ChartConfig

        return (
          <Card key={key} className='py-0'>
            <CardContent className='flex flex-col items-stretch gap-3 p-4'>
              <div className='flex items-center gap-2.5'>
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${style.iconClassName}`}>
                  <style.icon className='size-4.5' />
                </span>
                <p className='truncate text-sm font-medium'>{style.label}</p>
              </div>
              <div className='flex min-w-0 items-center justify-between'>
                <div>
                  <p className='mt-3 text-3xl font-bold tabular-nums'>{values[key]}</p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>orders</p>
                </div>
                <ChartContainer config={chartConfig} className='aspect-auto h-14 w-24 self-end sm:w-28'>
                  <AreaChart data={trends[key]} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`orders-kpi-${key}`} x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor={style.color} stopOpacity={0.3} />
                        <stop offset='100%' stopColor={style.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      dataKey='value'
                      type='monotone'
                      stroke={style.color}
                      strokeWidth={1.75}
                      fill={`url(#orders-kpi-${key})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default OrdersKpiCards
