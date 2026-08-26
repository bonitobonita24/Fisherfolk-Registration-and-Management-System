// Third-party Imports
import { format } from 'date-fns'
import { BanIcon, CheckCircle2Icon, CircleCheckBigIcon, FilePlus2Icon, PackageCheckIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { StockTransfer } from '@/types/entities/stock-transfer'

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

const ICON_MAP: Record<string, { icon: typeof BanIcon; className: string }> = {
  'file-plus-2': {
    icon: FilePlus2Icon,
    className: 'bg-primary text-primary-foreground'
  },
  'check-circle-2': {
    icon: CheckCircle2Icon,
    className: 'bg-success-soft text-success'
  },
  'package-check': {
    icon: PackageCheckIcon,
    className: 'bg-violet-600/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400'
  },
  truck: { icon: TruckIcon, className: 'bg-info-soft text-info' },
  'circle-check-big': {
    icon: CircleCheckBigIcon,
    className: 'bg-success-soft text-success'
  },
  ban: { icon: BanIcon, className: 'bg-destructive/10 text-destructive' }
}

type TransferTimelineProps = {
  t: StockTransfer
}

const TransferTimeline = ({ t }: TransferTimelineProps) => {
  return (
    <Card size='sm'>
      <CardContent className='space-y-4'>
        <h2 className='font-semibold'>Activity</h2>
        <Timeline>
          {t.activity.map((event, index) => {
            const mapping = ICON_MAP[event.icon] ?? ICON_MAP['file-plus-2']
            const { icon: Icon, className } = mapping
            const isLast = index === t.activity.length - 1

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
      </CardContent>
    </Card>
  )
}

export default TransferTimeline
