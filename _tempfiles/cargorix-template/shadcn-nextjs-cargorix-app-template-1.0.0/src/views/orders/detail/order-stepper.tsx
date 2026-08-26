'use client'

// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { Order, OrderStatus } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'
import {
  TimelineContentHorizontal,
  TimelineDotHorizontal,
  TimelineHeadingHorizontal,
  TimelineHorizontal,
  TimelineItemHorizontal,
  TimelineLineHorizontal
} from '@/components/ui/timeline-horizontal'

// Util Imports
import { cn } from '@/lib/utils'

const STEP_LABELS = [
  'Pending review',
  'Order received',
  'Order confirmed',
  'Create shipment',
  'In transit',
  'Delivered'
]

const STEPPED_STATUSES: OrderStatus[] = [
  'draft',
  'pending_review',
  'order_received',
  'ready_for_shipment',
  'in_fulfilment',
  'completed'
]

const STATUS_STEP: Partial<Record<OrderStatus, number>> = {
  draft: 0,
  pending_review: 0,
  order_received: 1,
  ready_for_shipment: 2,
  in_fulfilment: 3,
  completed: 5
}

const MOVED_SHIPMENT_STATUSES: Shipment['status'][] = ['in_transit', 'out_for_delivery', 'delivered', 'returned']

const DOT_CLASS = 'size-7 shrink-0 text-xs font-bold transition-colors'
const DOT_REACHED_CLASS = 'bg-primary text-primary-foreground'
const DOT_PENDING_CLASS = 'bg-background text-muted-foreground ring-border ring-1'

const LINE_CLASS = 'bg-border h-0.5 min-h-0 w-full min-w-0 flex-1 xl:min-w-0'

type OrderStepperProps = {
  order: Order
  shipment?: Shipment
}

const OrderStepper = ({ order, shipment }: OrderStepperProps) => {
  if (!STEPPED_STATUSES.includes(order.status)) return null

  const activityAt = (label: string) => order.activity.find(event => event.label === label)?.timestamp
  const shipmentAt = (label: string) => shipment?.timeline.find(event => event.label === label)?.timestamp

  const timestamps = [
    order.createdAt,
    activityAt('Order received'),
    activityAt('Order confirmed'),
    shipment?.createdAt ?? shipmentAt('Shipment created'),
    shipmentAt('In transit'),
    shipmentAt('Delivered')
  ]

  const baseStep = STATUS_STEP[order.status] ?? 0

  const activeStep =
    baseStep === 3 && shipment && MOVED_SHIPMENT_STATUSES.includes(shipment.status)
      ? shipmentAt('Delivered')
        ? 5
        : 4
      : baseStep

  const reached = timestamps.map((_, index) => index <= activeStep)

  return (
    <Card>
      <CardContent className='overflow-x-auto'>
        <TimelineHorizontal
          key={activeStep}
          className='w-full min-w-140 items-start py-1 max-xl:items-start max-sm:flex-row'
          defaultActiveIndex={activeStep}
        >
          {STEP_LABELS.map((label, index) => {
            const timestamp = timestamps[index]
            const isFirst = index === 0
            const isLast = index === STEP_LABELS.length - 1
            const isReached = reached[index]

            return (
              <TimelineItemHorizontal key={label} headingPosition='top' className='flex-1 items-stretch'>
                <div className='flex w-full items-center'>
                  {isFirst ? <span className='flex-1' /> : <TimelineLineHorizontal done className={LINE_CLASS} />}
                  <TimelineDotHorizontal
                    status='custom'
                    data-active={isReached}
                    className={cn(DOT_CLASS, isReached ? DOT_REACHED_CLASS : DOT_PENDING_CLASS)}
                  >
                    <span>{index + 1}</span>
                  </TimelineDotHorizontal>
                  {isLast ? <span className='flex-1' /> : <TimelineLineHorizontal className={LINE_CLASS} />}
                </div>
                <TimelineContentHorizontal align='center' className='mt-3 ml-0 px-2 xl:mt-3'>
                  <TimelineHeadingHorizontal
                    align='center'
                    className={`text-sm ${isReached ? '' : 'text-muted-foreground'}`}
                  >
                    {label}
                  </TimelineHeadingHorizontal>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {timestamp
                      ? `${format(new Date(timestamp), 'd MMM')} · ${format(new Date(timestamp), 'HH:mm')}`
                      : '—'}
                  </p>
                </TimelineContentHorizontal>
              </TimelineItemHorizontal>
            )
          })}
        </TimelineHorizontal>
      </CardContent>
    </Card>
  )
}

export default OrderStepper
