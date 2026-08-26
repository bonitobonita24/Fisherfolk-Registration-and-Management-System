// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowUpRightIcon, InfoIcon } from 'lucide-react'

// Type Imports
import type { StockTransfer } from '@/types/entities/stock-transfer'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const TRANSFER_RULES = [
  'Stock must be available at the source warehouse',
  'Source and destination warehouses must differ',
  'Creates two linked ledger entries — global stock quantity is unchanged'
]

type TransferRulesCardProps = {
  t: StockTransfer
}

const TransferRulesCard = ({ t }: TransferRulesCardProps) => {
  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>Rules & linked stock movement</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 p-4 text-sm'>
        <div className='bg-muted text-muted-foreground flex items-start gap-2 rounded-md p-3 text-xs'>
          <InfoIcon className='mt-0.5 size-4 shrink-0' />
          <span>Completing this transfer writes both ledger rows; global stock unchanged.</span>
        </div>

        <ul className='text-muted-foreground list-disc space-y-2 pl-4'>
          {TRANSFER_RULES.map(rule => (
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
              <p className='truncate text-sm font-medium'>{t.number || 'Draft'}</p>
              <p className='text-muted-foreground text-xs'>Appears in the ledger once completed</p>
            </div>
            <ArrowUpRightIcon className='text-muted-foreground size-4 shrink-0' />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default TransferRulesCard
