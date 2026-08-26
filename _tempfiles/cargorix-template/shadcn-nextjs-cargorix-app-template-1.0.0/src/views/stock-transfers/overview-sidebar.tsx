'use client'

// Third-party Imports
import { CheckCircle2Icon, CircleDotIcon, CircleIcon } from 'lucide-react'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Store Imports
import { useStockTransfersStore } from '@/store/use-stock-transfers-store'

// Util Imports
import { getTransferSummary } from '@/lib/selectors/stock-transfers-selectors'

const WORKFLOW_STEPS = [
  { label: 'Draft', description: 'Transfer created, awaiting dispatch' },
  { label: 'In Transit', description: 'Stock dispatched from source warehouse' },
  { label: 'Completed', description: 'Stock received at destination warehouse' }
]

const RULES = [
  'Transfers require approval if quantity > 100 units.',
  'Source warehouse must have sufficient available stock.',
  'A transfer cannot be edited once it is in transit or completed.'
]

const TransfersOverviewSidebar = () => {
  // Vars
  const transfers = useStockTransfersStore(state => state.transfers)
  const summary = getTransferSummary(transfers)

  return (
    <div className='grid h-fit grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1'>
      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Workflow</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-4 text-sm'>
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step.label} className='flex items-start gap-3'>
              {index === 0 ? (
                <CircleDotIcon className='text-info mt-0.5 size-4 shrink-0' />
              ) : (
                <CircleIcon className='text-muted-foreground mt-0.5 size-4 shrink-0' />
              )}
              <div>
                <p className='font-medium'>{step.label}</p>
                <p className='text-muted-foreground text-xs'>{step.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Transfer summary</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 p-4 text-sm'>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Total quantity transferred</span>
            <span className='text-right font-medium tabular-nums'>{summary.totalQuantity.toLocaleString()}</span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Outgoing quantity</span>
            <span className='text-right font-medium tabular-nums'>{summary.outgoing.toLocaleString()}</span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Incoming quantity</span>
            <span className='text-right font-medium tabular-nums'>{summary.incoming.toLocaleString()}</span>
          </div>

          <Separator />

          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Unique products transferred</span>
            <span className='text-right font-medium tabular-nums'>{summary.uniqueProducts.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Rules</CardTitle>
        </CardHeader>
        <CardContent className='p-4 text-sm'>
          <ul className='space-y-2'>
            {RULES.map(rule => (
              <li key={rule} className='flex items-start gap-2'>
                <CheckCircle2Icon className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                <span className='text-muted-foreground'>{rule}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default TransfersOverviewSidebar
