'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowRightIcon } from 'lucide-react'

// Type Imports
import type { StockMovement } from '@/types/entities/stock-movement'
import type { Warehouse, WarehouseInventory } from '@/types/entities/warehouse'

// Component Imports
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Util Imports
import { getWarehouseRecentMovements } from '@/lib/selectors/warehouse-selectors'

// Data Imports
import { MOVEMENT_TYPE_BADGE } from '@/views/stock-ledger/ledger-badges'
import { DOCK_DIRECTION_BADGE, DOCK_STATUS_BADGE } from '../warehouse-badges'

type WarehouseInventoryTabsProps = {
  warehouse: Warehouse
  inventory: WarehouseInventory
  movements: StockMovement[]
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const WarehouseInventoryTabs = ({ warehouse, inventory, movements }: WarehouseInventoryTabsProps) => {
  // Vars
  const inventoryRows = inventory.rows.slice(0, 8)
  const recentMovements = getWarehouseRecentMovements(warehouse.id, movements, 8)

  return (
    <Card>
      <CardContent>
        <Tabs defaultValue='inventory'>
          <div className='flex justify-between gap-3 max-md:flex-col md:items-center'>
            <ScrollArea className='min-w-0 flex-1'>
              <TabsList className='w-auto group-data-horizontal/tabs:h-fit'>
                <TabsTrigger className='h-full group-data-horizontal/tabs:after:h-0' value='inventory'>
                  Inventory summary
                </TabsTrigger>
                <TabsTrigger className='h-full group-data-horizontal/tabs:after:h-0' value='dock'>
                  Dock schedule
                </TabsTrigger>
                <TabsTrigger className='h-full group-data-horizontal/tabs:after:h-0' value='activity'>
                  Recent stock activity
                </TabsTrigger>
              </TabsList>

              <ScrollBar
                orientation='horizontal'
                className='data-horizontal:h-1.5 *:data-[slot=scroll-area-thumb]:bg-black/20'
              />
            </ScrollArea>
            <Button
              variant='link'
              size='sm'
              className='w-fit gap-1'
              render={<Link href='/products' />}
              nativeButton={false}
            >
              View full inventory
              <ArrowRightIcon data-icon='inline-end' />
            </Button>
          </div>

          <TabsContent value='inventory' className='mt-4'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className='text-right'>On-hand</TableHead>
                  <TableHead className='text-right'>Reserved</TableHead>
                  <TableHead className='text-right'>Available</TableHead>
                  <TableHead className='text-right'>Reorder point</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-muted-foreground py-8 text-center'>
                      No stock recorded at this warehouse.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryRows.map(row => (
                    <TableRow key={row.productId}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <img
                            src={row.primaryImage}
                            alt={row.name}
                            loading='lazy'
                            className='bg-muted size-8 shrink-0 rounded object-cover'
                          />
                          <span className='font-medium'>{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className='text-muted-foreground font-mono text-xs'>{row.sku}</TableCell>
                      <TableCell className='text-right font-medium tabular-nums'>{row.onHand}</TableCell>
                      <TableCell className='text-right tabular-nums'>{row.reserved}</TableCell>
                      <TableCell className='text-right tabular-nums'>{row.available}</TableCell>
                      <TableCell className='text-right tabular-nums'>{row.reorderPoint}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value='dock' className='mt-4'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Dock</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouse.dockSchedule.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-muted-foreground py-8 text-center'>
                      No dock appointments scheduled.
                    </TableCell>
                  </TableRow>
                ) : (
                  warehouse.dockSchedule.map(appointment => {
                    const directionBadge = DOCK_DIRECTION_BADGE[appointment.direction]
                    const statusBadge = DOCK_STATUS_BADGE[appointment.status]

                    return (
                      <TableRow key={appointment.id}>
                        <TableCell className='font-mono text-xs'>{appointment.reference}</TableCell>
                        <TableCell>
                          <Badge className={directionBadge.className}>{directionBadge.label}</Badge>
                        </TableCell>
                        <TableCell>{appointment.dock}</TableCell>
                        <TableCell className='whitespace-nowrap tabular-nums'>
                          {appointment.windowStart}&ndash;{appointment.windowEnd}
                        </TableCell>
                        <TableCell>{appointment.carrier}</TableCell>
                        <TableCell>
                          <span className='flex items-center gap-2'>
                            <span className={`size-1.5 rounded-full ${statusBadge.dotClassName}`} />
                            {statusBadge.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value='activity' className='mt-4'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className='text-right'>Qty</TableHead>
                  <TableHead className='text-right'>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-muted-foreground py-8 text-center'>
                      No recent stock activity.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentMovements.map(movement => {
                    const typeBadge = MOVEMENT_TYPE_BADGE[movement.type]

                    return (
                      <TableRow key={movement.id}>
                        <TableCell className='whitespace-nowrap'>
                          {dateFormatter.format(new Date(movement.date))}
                        </TableCell>
                        <TableCell>
                          <p className='font-medium'>{movement.name}</p>
                          <p className='text-muted-foreground text-xs'>{movement.sku}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
                        </TableCell>
                        <TableCell className='font-mono text-xs'>{movement.reference}</TableCell>
                        <TableCell
                          className={`text-right font-medium tabular-nums ${movement.quantity > 0 ? 'text-success' : 'text-destructive'}`}
                        >
                          {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                        </TableCell>
                        <TableCell className='text-right font-semibold tabular-nums'>{movement.balance}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default WarehouseInventoryTabs
