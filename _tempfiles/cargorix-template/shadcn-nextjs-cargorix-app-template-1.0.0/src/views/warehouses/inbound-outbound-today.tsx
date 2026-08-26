'use client'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Shared Imports
import ScheduleDockButton from '@/components/shared/schedule-dock-button'

// Store Imports
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { getInboundOutboundToday } from '@/lib/selectors/warehouse-selectors'

// Data Imports
import { DOCK_DIRECTION_BADGE, DOCK_STATUS_BADGE } from './warehouse-badges'

const InboundOutboundToday = () => {
  // Vars
  const warehouses = useWarehousesStore(state => state.warehouses)
  const rows = getInboundOutboundToday(warehouses)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inbound / Outbound today</CardTitle>
        <CardAction>
          <ScheduleDockButton variant='outline' size='sm' />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead>Reference</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Dock</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map(row => {
                const direction = DOCK_DIRECTION_BADGE[row.direction]
                const status = DOCK_STATUS_BADGE[row.status]

                return (
                  <TableRow key={row.id}>
                    <TableCell className='font-medium'>{row.reference}</TableCell>
                    <TableCell>
                      <Badge className={direction.className}>{direction.label}</Badge>
                    </TableCell>
                    <TableCell>{row.warehouseName}</TableCell>
                    <TableCell>{row.dock}</TableCell>
                    <TableCell className='tabular-nums'>{`${row.windowStart}–${row.windowEnd}`}</TableCell>
                    <TableCell>{row.carrier}</TableCell>
                    <TableCell>
                      <span className='flex items-center gap-2'>
                        <span className={`size-1.5 rounded-full ${status.dotClassName}`} />
                        {status.label}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow className='hover:bg-transparent'>
                <TableCell colSpan={7} className='text-muted-foreground h-24 text-center'>
                  No dock appointments scheduled today.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default InboundOutboundToday
