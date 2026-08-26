// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { computePurchaseOrderTotals } from '@/lib/selectors/purchase-orders-selectors'

type PoSummaryCardProps = {
  po: PurchaseOrder
}

const PoSummaryCard = ({ po }: PoSummaryCardProps) => {
  // Vars
  const totals = computePurchaseOrderTotals(po)

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>PO summary</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 p-4 text-sm'>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Subtotal ({totals.itemCount} items)</span>
          <span className='text-right font-medium tabular-nums'>${totals.subtotal.toFixed(2)}</span>
        </div>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Discount</span>
          <span className='text-right font-medium tabular-nums'>-${totals.discount.toFixed(2)}</span>
        </div>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Tax</span>
          <span className='text-right font-medium tabular-nums'>${totals.tax.toFixed(2)}</span>
        </div>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Shipping</span>
          <span className='text-right font-medium tabular-nums'>${totals.shipping.toFixed(2)}</span>
        </div>

        <Separator />

        <div className='flex items-baseline justify-between gap-4'>
          <span className='font-semibold'>Grand total</span>
          <span className='text-base font-semibold tabular-nums'>${totals.grandTotal.toFixed(2)}</span>
        </div>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Item count</span>
          <span className='text-right font-medium tabular-nums'>{totals.itemCount}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default PoSummaryCard
