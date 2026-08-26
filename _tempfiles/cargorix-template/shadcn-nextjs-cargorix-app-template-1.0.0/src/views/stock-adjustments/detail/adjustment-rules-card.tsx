// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowUpRightIcon, InfoIcon } from 'lucide-react'

// Type Imports
import type { StockAdjustment } from '@/types/entities/stock-adjustment'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const ADJUSTMENT_RULES = [
  'Each line writes one signed stock-ledger row',
  'Updates global on-hand for each product',
  'Cannot drive stock negative',
  'No reversal — create a new adjustment to correct'
]

type AdjustmentRulesCardProps = {
  a: StockAdjustment
}

const AdjustmentRulesCard = ({ a }: AdjustmentRulesCardProps) => {
  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>Rules & linked stock movement</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 p-4 text-sm'>
        <div className='bg-muted text-muted-foreground flex items-start gap-2 rounded-md p-3 text-xs'>
          <InfoIcon className='mt-0.5 size-4 shrink-0' />
          <span>Posting this adjustment writes one signed stock-ledger row per line and updates global on-hand.</span>
        </div>

        <ul className='text-muted-foreground list-disc space-y-2 pl-4'>
          {ADJUSTMENT_RULES.map(rule => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>

        <Separator />

        <div className='space-y-2'>
          <p className='text-muted-foreground text-xs'>Linked stock movement</p>
          <Link
            href='/stock-ledger'
            className='hover:bg-muted flex items-center justify-between gap-3 rounded-md border p-3 transition-colors'
          >
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium'>{a.number || 'Draft'}</p>
              <p className='text-muted-foreground text-xs'>Appears in the ledger once posted</p>
            </div>
            <ArrowUpRightIcon className='text-muted-foreground size-4 shrink-0' />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdjustmentRulesCard
