// Third-party Imports
import { format } from 'date-fns'
import type { LucideIcon } from 'lucide-react'
import { FileTextIcon, PlusSquareIcon, TruckIcon, UserRoundIcon } from 'lucide-react'

// Type Imports
import type { Supplier, SupplierActivityEntry } from '@/types/entities/supplier'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type RecentActivityCardProps = {
  supplier: Supplier
}

const ACTIVITY_ICON: Record<SupplierActivityEntry['icon'], LucideIcon> = {
  'file-text': FileTextIcon,
  truck: TruckIcon,
  'plus-square': PlusSquareIcon,
  user: UserRoundIcon
}

const RecentActivityCard = ({ supplier }: RecentActivityCardProps) => {
  const activity = supplier.activity ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>No recent activity.</p>
        ) : (
          <ul className='space-y-4'>
            {activity.map(entry => {
              const Icon = ACTIVITY_ICON[entry.icon]

              return (
                <li key={entry.id} className='flex items-start justify-between gap-3 max-sm:flex-col'>
                  <div className='flex items-center gap-2'>
                    <span className='bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
                      <Icon className='size-4' />
                    </span>
                    <p className='min-w-0 flex-1 text-sm font-medium wrap-break-word'>{entry.label}</p>
                  </div>
                  <span className='shrink-0 sm:text-right'>
                    <span className='text-muted-foreground block text-xs whitespace-nowrap'>
                      {format(new Date(entry.at), 'dd MMM yyyy, h:mm a')}
                    </span>
                    <span className='text-muted-foreground block text-xs whitespace-nowrap'>by {entry.actor}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivityCard
