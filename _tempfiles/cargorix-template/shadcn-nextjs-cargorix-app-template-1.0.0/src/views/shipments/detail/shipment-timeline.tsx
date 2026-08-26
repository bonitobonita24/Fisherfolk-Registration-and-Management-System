// Third-party Imports
import { format } from 'date-fns'
import { CheckIcon } from 'lucide-react'

// Type Imports
import type { ShipmentTimelineEvent } from '@/types/entities/shipment'

// Component Imports
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine
} from '@/components/ui/timeline'

const DOT_CLASS: Record<ShipmentTimelineEvent['state'], string> = {
  done: 'size-5 rounded-full bg-success text-white dark:text-black',
  current: 'size-5 rounded-full bg-success-soft text-success ring-2 ring-green-600 dark:ring-green-400',
  pending: 'bg-background text-transparent ring-border size-5 rounded-full ring-1'
}

type ShipmentTimelineProps = {
  timeline: ShipmentTimelineEvent[]
}

const ShipmentTimeline = ({ timeline }: ShipmentTimelineProps) => {
  return (
    <div className='space-y-4'>
      <h3 className='font-semibold'>Delivery timeline</h3>
      <Timeline>
        {timeline.map((event, index) => {
          const isLast = index === timeline.length - 1

          return (
            <TimelineItem key={event.id} status='done' className='gap-x-0'>
              <TimelineDot status='custom' className={`shrink-0 [&>svg]:size-3 ${DOT_CLASS[event.state]}`}>
                <CheckIcon />
              </TimelineDot>
              {!isLast && (
                <TimelineLine
                  done={false}
                  className={`min-h-5 ${event.state === 'pending' ? 'bg-border' : 'bg-success'}`}
                />
              )}
              <TimelineHeading
                className={`pl-3 text-sm font-semibold text-wrap ${event.state === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}
              >
                {event.label}
              </TimelineHeading>
              <TimelineContent className='pb-4 pl-3'>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {event.timestamp ? format(new Date(event.timestamp), 'd MMM · HH:mm') : 'Pending'}
                </p>
              </TimelineContent>
            </TimelineItem>
          )
        })}
      </Timeline>
    </div>
  )
}

export default ShipmentTimeline
