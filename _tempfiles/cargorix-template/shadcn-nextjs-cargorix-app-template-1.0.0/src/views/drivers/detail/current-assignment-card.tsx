'use client'

// Third-party Imports
import { toast } from 'sonner'
import { MapPinnedIcon } from 'lucide-react'

// Type Imports
import type { Driver } from '@/types/entities/driver'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type CurrentAssignmentCardProps = {
  driver: Driver
}

const CurrentAssignmentCard = ({ driver }: CurrentAssignmentCardProps) => {
  // Vars
  const assignment = driver.currentAssignment

  const rows = assignment
    ? [
        { label: 'Route', value: assignment.routeName },
        { label: 'Shipment', value: assignment.shipmentId, sub: assignment.cargo },
        { label: 'Origin', value: assignment.origin, sub: assignment.originAddress },
        { label: 'Destination', value: assignment.destination, sub: assignment.destinationAddress },
        { label: 'Next Stop', value: assignment.nextStop, sub: assignment.nextStopDistance },
        { label: 'ETA', value: assignment.etaLabel }
      ]
    : []

  return (
    <Card>
      <CardHeader className='flex items-center justify-between'>
        <CardTitle>Current Assignment</CardTitle>
        {assignment && (
          <Button variant='link' size='sm' className='h-auto p-0' onClick={() => toast('Route planner coming soon')}>
            View full route
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {assignment ? (
          <dl className='space-y-3 text-sm'>
            {rows.map(row => (
              <div key={row.label} className='flex items-start justify-between gap-4'>
                <dt className='text-muted-foreground'>{row.label}</dt>
                <dd className='text-right'>
                  <span className='font-medium'>{row.value || '—'}</span>
                  {row.sub && <span className='text-muted-foreground block text-xs'>{row.sub}</span>}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className='flex flex-col items-center justify-center gap-2 py-12 text-center'>
            <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
              <MapPinnedIcon className='text-muted-foreground size-6' />
            </div>
            <p className='font-medium'>No active assignment</p>
            <p className='text-muted-foreground text-sm'>This driver is not currently assigned to a route.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CurrentAssignmentCard
