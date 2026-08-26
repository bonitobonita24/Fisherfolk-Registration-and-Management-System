// Third-party Imports
import { format } from 'date-fns'
import { BanIcon, CircleCheckBigIcon, FilePlus2Icon, MapPinCheckIcon, RouteIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { Route, RouteActivityEvent } from '@/types/entities/route'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine
} from '@/components/ui/timeline'

const ICON_MAP: Record<RouteActivityEvent['icon'], { icon: typeof BanIcon; className: string }> = {
  'file-plus-2': { icon: FilePlus2Icon, className: 'bg-primary text-primary-foreground' },
  route: { icon: RouteIcon, className: 'bg-info-soft text-info' },
  truck: { icon: TruckIcon, className: 'bg-warning-soft text-warning' },
  'map-pin-check': { icon: MapPinCheckIcon, className: 'bg-info-soft text-info' },
  'circle-check-big': { icon: CircleCheckBigIcon, className: 'bg-success-soft text-success' },
  ban: { icon: BanIcon, className: 'bg-destructive/10 text-destructive' }
}

type RouteActivityCardProps = {
  route: Route
}

const RouteActivityCard = ({ route }: RouteActivityCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {route.activity.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No activity recorded yet.</p>
        ) : (
          <Timeline>
            {route.activity.map((event, index) => {
              const { icon: Icon, className } = ICON_MAP[event.icon]
              const isLast = index === route.activity.length - 1

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
                  </TimelineContent>
                </TimelineItem>
              )
            })}
          </Timeline>
        )}
      </CardContent>
    </Card>
  )
}

export default RouteActivityCard
