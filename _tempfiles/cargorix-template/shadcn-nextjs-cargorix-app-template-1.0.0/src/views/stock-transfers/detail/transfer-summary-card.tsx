// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { StockTransfer } from '@/types/entities/stock-transfer'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { computeTransferTotals } from '@/lib/selectors/stock-transfers-selectors'

const EM_DASH = '—'

type TransferSummaryCardProps = {
  t: StockTransfer
}

const TransferSummaryCard = ({ t }: TransferSummaryCardProps) => {
  // Vars
  const totals = computeTransferTotals(t)
  const dispatchDate = t.dispatchDate ? format(new Date(t.dispatchDate), 'd MMM yyyy') : EM_DASH
  const expectedArrival = t.expectedArrival ? format(new Date(t.expectedArrival), 'd MMM yyyy') : EM_DASH

  const rows: { label: string; value: string }[] = [
    { label: 'Source', value: t.sourceWarehouseName || EM_DASH },
    { label: 'Destination', value: t.destinationWarehouseName || EM_DASH },
    { label: 'Requested by', value: t.requestedBy || EM_DASH },
    { label: 'Dispatch date', value: dispatchDate },
    { label: 'Expected arrival', value: expectedArrival },
    { label: 'Transfer type', value: t.transferType || EM_DASH },
    { label: 'Reference', value: t.reference || EM_DASH }
  ]

  const optionalRows = [
    { label: 'Priority', value: t.priority },
    { label: 'Transporter', value: t.transporter },
    { label: 'Tracking number', value: t.trackingNumber }
  ].filter(row => row.value.trim() !== '')

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>Transfer summary</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 p-4 text-sm'>
        {rows.map(row => (
          <div key={row.label} className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>{row.label}</span>
            <span className='truncate text-right font-medium'>{row.value}</span>
          </div>
        ))}

        {optionalRows.length > 0 && (
          <>
            <Separator />
            {optionalRows.map(row => (
              <div key={row.label} className='flex items-baseline justify-between gap-4'>
                <span className='text-muted-foreground'>{row.label}</span>
                <span className='truncate text-right font-medium'>{row.value}</span>
              </div>
            ))}
          </>
        )}

        <Separator />

        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Total line items</span>
          <span className='text-right font-medium tabular-nums'>{totals.totalLines}</span>
        </div>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Total quantity</span>
          <span className='text-right font-medium tabular-nums'>{totals.totalUnitsSent}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default TransferSummaryCard
