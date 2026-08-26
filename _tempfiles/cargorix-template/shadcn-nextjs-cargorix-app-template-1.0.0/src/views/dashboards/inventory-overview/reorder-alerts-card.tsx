'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChevronRightIcon } from 'lucide-react'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { getReorderAlerts } from '@/lib/selectors/inventory-selectors'
import { getInitials } from '@/lib/get-initials'

const VISIBLE_ALERTS = 11

const ReorderAlertsCard = () => {
  const products = useProductsStore(state => state.products)
  const warehouses = useWarehousesStore(state => state.warehouses)

  const reorderAlerts = getReorderAlerts(products, warehouses)
  const visibleAlerts = reorderAlerts.slice(0, VISIBLE_ALERTS)

  return (
    <Card className='h-full gap-0!'>
      <CardHeader className='border-b'>
        <div className='flex items-center gap-2'>
          <CardTitle>Reorder Alerts</CardTitle>
          <Badge variant='secondary'>{reorderAlerts.length}</Badge>
        </div>
        <CardAction>
          <Button size='sm' variant='outline' render={<Link href='/products' />} nativeButton={false}>
            View all
            <ChevronRightIcon data-icon='inline-end' />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className='px-0'>
        <Table className='min-w-130 table-fixed'>
          <TableHeader>
            <TableRow>
              <TableHead className='px-5'>Product</TableHead>
              <TableHead className='w-32'>Warehouse</TableHead>
              <TableHead className='w-16'>Status</TableHead>
              <TableHead className='w-32 pr-5 text-right'>Reorder point</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleAlerts.map(alert => (
              <TableRow key={alert.id} className='[&>td]:py-2.5'>
                <TableCell className='px-5'>
                  <div className='flex items-center gap-2.5'>
                    <span className='bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
                      {getInitials(alert.productName)}
                    </span>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium' title={alert.productName}>
                        {alert.productName}
                      </p>
                      <p className='text-muted-foreground mt-0.5 text-xs'>{alert.sku}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className='text-muted-foreground truncate' title={alert.warehouse}>
                  {alert.warehouse}
                </TableCell>
                <TableCell>
                  <Badge variant='outline' className={alert.severity === 'out' ? 'text-destructive' : 'text-warning'}>
                    {alert.stockLabel}
                  </Badge>
                </TableCell>
                <TableCell className='pr-5 text-right tabular-nums'>{alert.reorderPoint}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default ReorderAlertsCard
