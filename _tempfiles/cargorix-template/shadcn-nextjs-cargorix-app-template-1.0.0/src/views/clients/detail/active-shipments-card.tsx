'use client'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { format } from 'date-fns'
import { ChevronRightIcon, EyeIcon, MoreHorizontalIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { ACTIVE_SHIPMENT_STATUSES, getClientShipments } from '@/lib/selectors/client-selectors'

// Data Imports
import { SHIPMENT_STATUS_BADGE } from '@/views/shipments/shipment-badges'

type ActiveShipmentsCardProps = {
  client: Client
  orders: Order[]
  shipments: Shipment[]
}

const ActiveShipmentsCard = ({ client, orders, shipments }: ActiveShipmentsCardProps) => {
  // Vars
  const activeShipments = getClientShipments(shipments, orders, client.id)
    .filter(shipment => ACTIVE_SHIPMENT_STATUSES.includes(shipment.status))
    .slice(0, 5)

  // Hooks
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Shipments</CardTitle>
      </CardHeader>
      <CardContent>
        {activeShipments.length === 0 ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>No active shipments.</p>
        ) : (
          <div className='overflow-x-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment #</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeShipments.map(shipment => {
                  const status = SHIPMENT_STATUS_BADGE[shipment.status]
                  const destination = orders.find(order => order.id === shipment.orderId)?.deliveryAddress

                  return (
                    <TableRow key={shipment.id}>
                      <TableCell className='font-medium'>{shipment.displayId}</TableCell>
                      <TableCell className='text-muted-foreground'>{shipment.originHub}</TableCell>
                      <TableCell className='text-muted-foreground'>{destination || '—'}</TableCell>
                      <TableCell className='whitespace-nowrap'>
                        {format(new Date(shipment.deliveryDeadline), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant='ghost'
                                size='icon'
                                className='size-8'
                                aria-label={`Actions for ${shipment.displayId}`}
                              />
                            }
                          >
                            <MoreHorizontalIcon className='size-4' />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-fit'>
                            <DropdownMenuItem onClick={() => router.push(`/shipments/${shipment.id}`)}>
                              <EyeIcon data-icon='inline-start' />
                              View shipment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant='ghost'
          className='w-full justify-between'
          render={<Link href='/shipments' />}
          nativeButton={false}
        >
          View all shipments
          <ChevronRightIcon data-icon='inline-end' />
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ActiveShipmentsCard
