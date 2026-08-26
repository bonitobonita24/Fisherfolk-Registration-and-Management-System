'use client'

// Third-party Imports
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CheckCircle2Icon, XCircleIcon } from 'lucide-react'

// Type Imports
import type { Driver, DriverTrip } from '@/types/entities/driver'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type TripHistoryCardProps = {
  driver: Driver
}

const STATUS_BADGE: Record<DriverTrip['status'], { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'bg-success-soft text-success' },
  late: { label: 'Late', className: 'bg-warning-soft text-warning' },
  in_progress: { label: 'In Progress', className: 'bg-info-soft text-info' }
}

const formatDate = (value?: string) => (value ? format(new Date(value), 'dd MMM yyyy') : '—')

const TripHistoryCard = ({ driver }: TripHistoryCardProps) => {
  // Vars
  const trips = driver.tripHistory ?? []

  return (
    <Card>
      <CardHeader className='flex items-center justify-between'>
        <CardTitle>Performance &amp; Trip History</CardTitle>
        <Button variant='link' size='sm' className='h-auto p-0' onClick={() => toast('Trip history coming soon')}>
          View all trips
        </Button>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Trip / Shipment</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className='text-right'>Distance</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>On-time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='text-muted-foreground py-6 text-center text-sm'>
                    No trips recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                trips.map(trip => {
                  const status = STATUS_BADGE[trip.status]

                  return (
                    <TableRow key={trip.id}>
                      <TableCell className='whitespace-nowrap'>{formatDate(trip.date)}</TableCell>
                      <TableCell className='font-medium'>{trip.shipmentId}</TableCell>
                      <TableCell className='text-muted-foreground whitespace-nowrap'>
                        {trip.origin} → {trip.destination}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>{trip.distanceKm} km</TableCell>
                      <TableCell className='whitespace-nowrap'>{trip.durationLabel}</TableCell>
                      <TableCell>
                        {trip.onTime ? (
                          <span className='text-success inline-flex items-center gap-1.5'>
                            <CheckCircle2Icon className='size-4' />
                            Yes
                          </span>
                        ) : (
                          <span className='text-muted-foreground inline-flex items-center gap-1.5'>
                            <XCircleIcon className='size-4' />
                            No
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.className}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default TripHistoryCard
