// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { computeLineAmounts } from '@/lib/selectors/purchase-orders-selectors'

type PoLineItemsTableProps = {
  po: PurchaseOrder
}

const PoLineItemsTable = ({ po }: PoLineItemsTableProps) => {
  // Vars
  const totals = po.lines.reduce(
    (acc, line) => {
      const remaining = Math.max(0, line.quantityOrdered - line.receivedQty)
      const amounts = computeLineAmounts(line)

      return {
        ordered: acc.ordered + line.quantityOrdered,
        received: acc.received + line.receivedQty,
        remaining: acc.remaining + remaining,
        total: acc.total + amounts.total
      }
    },
    { ordered: 0, received: 0, remaining: 0, total: 0 }
  )

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>Line items</CardTitle>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='overflow-x-auto rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className='text-right'>Ordered</TableHead>
                <TableHead className='text-right'>Received</TableHead>
                <TableHead className='text-right'>Remaining</TableHead>
                <TableHead className='text-right'>Unit cost</TableHead>
                <TableHead className='text-right'>Tax</TableHead>
                <TableHead className='text-right'>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.lines.map(line => {
                const remaining = Math.max(0, line.quantityOrdered - line.receivedQty)
                const amounts = computeLineAmounts(line)

                return (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <img
                          src={line.primaryImage}
                          alt={line.name}
                          loading='lazy'
                          className='bg-muted size-10 shrink-0 rounded-md object-cover'
                        />
                        <span className='font-medium'>{line.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>{line.sku}</TableCell>
                    <TableCell className='text-right tabular-nums'>{line.quantityOrdered}</TableCell>
                    <TableCell className='text-right tabular-nums'>{line.receivedQty}</TableCell>
                    <TableCell className='text-right tabular-nums'>{remaining}</TableCell>
                    <TableCell className='text-right tabular-nums'>${line.unitCost.toFixed(2)}</TableCell>
                    <TableCell className='text-right tabular-nums'>{line.taxRatePercent}%</TableCell>
                    <TableCell className='text-right font-medium tabular-nums'>${amounts.total.toFixed(2)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className='font-semibold'>
                  Totals
                </TableCell>
                <TableCell className='text-right font-semibold tabular-nums'>{totals.ordered}</TableCell>
                <TableCell className='text-right font-semibold tabular-nums'>{totals.received}</TableCell>
                <TableCell className='text-right font-semibold tabular-nums'>{totals.remaining}</TableCell>
                <TableCell />
                <TableCell />
                <TableCell className='text-right font-semibold tabular-nums'>${totals.total.toFixed(2)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default PoLineItemsTable
