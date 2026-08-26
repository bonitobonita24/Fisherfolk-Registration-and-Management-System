// Third-party Imports
import { format } from 'date-fns'
import { BadgeCheckIcon, BanIcon, FilePlus2Icon, MapPinCheckIcon, PauseIcon, PlayIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { Order, OrderActivityEvent } from '@/types/entities/order'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine
} from '@/components/ui/timeline'

const ICON_MAP: Record<OrderActivityEvent['icon'], { icon: typeof BanIcon; className: string }> = {
  'badge-check': {
    icon: BadgeCheckIcon,
    className: 'bg-success-soft text-success'
  },
  'map-pin-check': { icon: MapPinCheckIcon, className: 'bg-info-soft text-info' },
  'file-plus-2': {
    icon: FilePlus2Icon,
    className: 'bg-primary text-primary-foreground'
  },
  truck: { icon: TruckIcon, className: 'bg-violet-600/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400' },
  ban: { icon: BanIcon, className: 'bg-destructive/10 text-destructive' },
  play: { icon: PlayIcon, className: 'bg-success-soft text-success' },
  pause: { icon: PauseIcon, className: 'bg-warning-soft text-warning' }
}

type OrderActivityCardProps = {
  order: Order
}

const OrderActivityCard = ({ order }: OrderActivityCardProps) => {
  return (
    <Card size='sm'>
      <CardContent className='space-y-4'>
        <h2 className='font-semibold'>Activity</h2>
        <Timeline>
          {order.activity.map((event, index) => {
            const { icon: Icon, className } = ICON_MAP[event.icon]
            const isLast = index === order.activity.length - 1

            return (
              <TimelineItem key={event.id} status='done' className='gap-x-0'>
                <TimelineDot status='custom' className={`size-8 shrink-0 rounded-full [&>svg]:size-4 ${className}`}>
                  <Icon />
                </TimelineDot>
                {!isLast && <TimelineLine done={false} className='bg-border min-h-6' />}
                <TimelineHeading className='text-foreground pl-3 text-sm font-semibold text-wrap'>
                  {event.label}
                </TimelineHeading>
                <TimelineContent className='pb-5 pl-3'>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {event.actor} · {format(new Date(event.timestamp), 'd MMM yyyy, HH:mm')}
                  </p>
                  {event.description && <p className='text-muted-foreground mt-1 text-xs'>{event.description}</p>}
                </TimelineContent>
              </TimelineItem>
            )
          })}
        </Timeline>
      </CardContent>
    </Card>
  )
}

export default OrderActivityCard
