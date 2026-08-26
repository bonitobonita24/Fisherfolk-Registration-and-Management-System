// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { Route } from '@/types/entities/route'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { formatStopWindow, spansMultipleDays } from '../stop-window'

// Data Imports
import { ROUTE_STOP_STATUS_BADGE } from '../route-badges'

type RouteStopsTableProps = {
  route: Route
}

const formatTime = (value: string) => {
  if (!value) return '—'

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? '—' : format(parsed, 'HH:mm')
}

const RouteStopsTable = ({ route }: RouteStopsTableProps) => {
  // Vars
  const showDate = spansMultipleDays(route.stops.map(stop => stop.windowStart))

  return (
    <Card>
      <CardHeader className='flex items-center justify-between'>
        <CardTitle>Stops</CardTitle>
        <span className='text-muted-foreground text-sm tabular-nums'>{route.stops.length} total</span>
      </CardHeader>
      <CardContent>
        {route.stops.length === 0 ? (
          <p className='text-muted-foreground py-8 text-center text-sm'>No stops on this route yet.</p>
        ) : (
          <div className='overflow-x-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'>#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className='whitespace-nowrap'>Time Window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>ETA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {route.stops.map(stop => {
                  const badge = ROUTE_STOP_STATUS_BADGE[stop.status]

                  return (
                    <TableRow key={stop.id}>
                      <TableCell className='text-muted-foreground tabular-nums'>{stop.sequence}</TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='font-medium'>{stop.customerName}</span>
                          <span className='text-muted-foreground text-xs'>{stop.displayId}</span>
                        </div>
                      </TableCell>
                      <TableCell className='text-muted-foreground max-w-70 truncate'>{stop.address}</TableCell>
                      <TableCell className='whitespace-nowrap tabular-nums'>
                        {formatStopWindow(stop.windowStart, stop.windowEnd, showDate)}
                      </TableCell>
                      <TableCell>
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>{formatTime(stop.etaAt)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RouteStopsTable
