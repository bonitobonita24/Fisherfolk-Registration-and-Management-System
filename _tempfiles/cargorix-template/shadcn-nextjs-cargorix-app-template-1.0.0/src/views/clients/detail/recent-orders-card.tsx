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

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { getClientOrders } from '@/lib/selectors/client-selectors'

// Data Imports
import { ORDER_STATUS_BADGE } from '@/views/orders/order-badges'

type RecentOrdersCardProps = {
  client: Client
  orders: Order[]
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const RecentOrdersCard = ({ client, orders }: RecentOrdersCardProps) => {
  // Vars
  const recentOrders = getClientOrders(orders, client.id).slice(0, 5)

  // Hooks
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {recentOrders.length === 0 ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>No orders yet.</p>
        ) : (
          <div className='overflow-x-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Order date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Total amount</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map(order => {
                  const status = ORDER_STATUS_BADGE[order.status]

                  return (
                    <TableRow key={order.id}>
                      <TableCell className='font-medium'>{order.displayId}</TableCell>
                      <TableCell className='text-muted-foreground whitespace-nowrap'>
                        {format(new Date(order.createdAt), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>{currency.format(order.totalAmount)}</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant='ghost'
                                size='icon'
                                className='size-8'
                                aria-label={`Actions for ${order.displayId}`}
                              />
                            }
                          >
                            <MoreHorizontalIcon className='size-4' />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-fit'>
                            <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)}>
                              <EyeIcon data-icon='inline-start' />
                              View order
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
          render={<Link href='/orders' />}
          nativeButton={false}
        >
          View all orders
          <ChevronRightIcon data-icon='inline-end' />
        </Button>
      </CardFooter>
    </Card>
  )
}

export default RecentOrdersCard
