'use client'

// Third-party Imports
import { toast } from 'sonner'
import { format } from 'date-fns'

// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type RecentActivityCardProps = {
  vehicle: Vehicle
}

const RecentActivityCard = ({ vehicle }: RecentActivityCardProps) => {
  // Vars
  const activity = vehicle.activity ?? []

  return (
    <Card>
      <CardHeader className='flex items-center justify-between'>
        <CardTitle>Recent Activity</CardTitle>
        {activity.length > 0 && (
          <Button variant='link' size='sm' className='h-auto p-0' onClick={() => toast('Activity log coming soon')}>
            View all
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No recent activity.</p>
        ) : (
          <ul className='space-y-4'>
            {activity.map(entry => (
              <li key={entry.id} className='flex gap-3'>
                <span className='bg-primary mt-1.5 size-2 shrink-0 rounded-full' />
                <div className='space-y-0.5'>
                  <p className='text-sm font-medium'>{entry.label}</p>
                  <p className='text-muted-foreground text-xs'>{format(new Date(entry.at), 'dd MMM yyyy, HH:mm')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivityCard
