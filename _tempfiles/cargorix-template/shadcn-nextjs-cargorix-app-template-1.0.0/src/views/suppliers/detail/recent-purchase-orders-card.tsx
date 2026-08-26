// Next Imports
import Link from 'next/link'

// Third-party Imports
import { format } from 'date-fns'
import { ChevronRightIcon, ExternalLinkIcon } from 'lucide-react'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { computePurchaseOrderTotals } from '@/lib/selectors/purchase-orders-selectors'
import { getSupplierPurchaseOrders } from '@/lib/selectors/supplier-selectors'

// Data Imports
import { PO_STATUS_BADGE } from '@/views/purchase-orders/po-badges'

type RecentPurchaseOrdersCardProps = {
  supplier: Supplier
  purchaseOrders: PurchaseOrder[]
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const RecentPurchaseOrdersCard = ({ supplier, purchaseOrders }: RecentPurchaseOrdersCardProps) => {
  // Vars
  const recentPOs = getSupplierPurchaseOrders(purchaseOrders, supplier.id).slice(0, 5)

  return (
    <Card>
      <CardHeader className='flex flex-wrap items-center justify-between gap-2'>
        <CardTitle>Recent Purchase Orders</CardTitle>
        <Button variant='secondary' render={<Link href='/purchase-orders' />} nativeButton={false}>
          View all POs
          <ChevronRightIcon />
        </Button>
      </CardHeader>
      <CardContent>
        {recentPOs.length === 0 ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>No purchase orders yet.</p>
        ) : (
          <div className='overflow-x-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Order Total</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPOs.map(po => {
                  const status = PO_STATUS_BADGE[po.status]

                  return (
                    <TableRow key={po.id}>
                      <TableCell className='font-medium whitespace-nowrap'>{po.number}</TableCell>
                      <TableCell className='text-muted-foreground whitespace-nowrap'>
                        {format(new Date(po.createdAt), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className='text-muted-foreground whitespace-nowrap'>
                        {po.expectedDeliveryDate ? format(new Date(po.expectedDeliveryDate), 'dd MMM yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {currency.format(computePurchaseOrderTotals(po).grandTotal)}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8'
                          aria-label={`Open ${po.number}`}
                          render={<Link href={`/purchase-orders/${po.id}`} />}
                          nativeButton={false}
                        >
                          <ExternalLinkIcon className='size-4' />
                        </Button>
                      </TableCell>
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

export default RecentPurchaseOrdersCard
