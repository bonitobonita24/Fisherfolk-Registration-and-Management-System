// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { StockAdjustment } from '@/types/entities/stock-adjustment'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { computeAdjustmentTotals } from '@/lib/selectors/stock-adjustments-selectors'
import { ADJUSTMENT_REASON_LABEL } from '../adjustment-badges'

const EM_DASH = '—'

const formatSigned = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0')

const signedClassName = (n: number) => (n > 0 ? 'text-success' : n < 0 ? 'text-destructive' : '')

type AdjustmentSummaryCardProps = {
  a: StockAdjustment
}

const AdjustmentSummaryCard = ({ a }: AdjustmentSummaryCardProps) => {
  // Vars
  const totals = computeAdjustmentTotals(a)
  const date = a.date ? format(new Date(a.date), 'd MMM yyyy') : EM_DASH
  const created = a.createdAt ? format(new Date(a.createdAt), 'd MMM yyyy') : EM_DASH

  const rows: { label: string; value: string }[] = [
    { label: 'Warehouse', value: a.warehouseName || EM_DASH },
    { label: 'Reason', value: ADJUSTMENT_REASON_LABEL[a.reason] },
    { label: 'Requested by', value: a.requestedBy || EM_DASH },
    { label: 'Date', value: date },
    { label: 'Created', value: created }
  ]

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>Adjustment summary</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 p-4 text-sm'>
        {rows.map(row => (
          <div key={row.label} className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>{row.label}</span>
            <span className='truncate text-right font-medium'>{row.value}</span>
          </div>
        ))}

        {a.postedAt && (
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Posted</span>
            <span className='truncate text-right font-medium'>{format(new Date(a.postedAt), 'd MMM yyyy')}</span>
          </div>
        )}

        <Separator />

        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Total lines</span>
          <span className='text-right font-medium tabular-nums'>{totals.lineCount}</span>
        </div>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Total added</span>
          <span className='text-success text-right font-medium tabular-nums'>+{totals.totalAdded}</span>
        </div>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Total removed</span>
          <span className='text-destructive text-right font-medium tabular-nums'>−{totals.totalRemoved}</span>
        </div>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Net change</span>
          <span className={`text-right font-medium tabular-nums ${signedClassName(totals.netChange)}`}>
            {formatSigned(totals.netChange)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdjustmentSummaryCard
