// Third-party Imports
import { format } from 'date-fns'
import type { LucideIcon } from 'lucide-react'
import { FileTextIcon, ShoppingCartIcon, TruckIcon, UserRoundIcon } from 'lucide-react'

// Type Imports
import type { Client, ClientActivityEntry } from '@/types/entities/client'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type RecentActivityCardProps = {
  client: Client
}

const ACTIVITY_ICON: Record<ClientActivityEntry['icon'], LucideIcon> = {
  'shopping-cart': ShoppingCartIcon,
  truck: TruckIcon,
  'file-text': FileTextIcon,
  user: UserRoundIcon
}

const RecentActivityCard = ({ client }: RecentActivityCardProps) => {
  // Vars
  const activity = client.activity ?? []

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
                <li key={entry.id} className='flex items-start gap-3'>
                  <span className='bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
                    <Icon className='size-4' />
                  </span>
                  <p className='min-w-0 flex-1 text-sm font-medium wrap-break-word'>{entry.label}</p>
                  <span className='text-muted-foreground shrink-0 text-xs whitespace-nowrap'>
                    {format(new Date(entry.at), 'dd MMM yyyy, h:mm a')}
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
