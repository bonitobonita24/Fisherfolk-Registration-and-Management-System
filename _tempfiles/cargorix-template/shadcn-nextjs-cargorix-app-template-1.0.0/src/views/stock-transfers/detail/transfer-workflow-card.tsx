// Third-party Imports
import { BanIcon, CheckIcon, FilePlus2Icon, PackageCheckIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { StockTransfer } from '@/types/entities/stock-transfer'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type TransferWorkflowCardProps = {
  t: StockTransfer
}

const STEPS: { key: string; label: string; icon: typeof FilePlus2Icon }[] = [
  { key: 'draft', label: 'Draft', icon: FilePlus2Icon },
  { key: 'in_transit', label: 'In Transit', icon: TruckIcon },
  { key: 'completed', label: 'Completed', icon: PackageCheckIcon }
]

const ORDER: Record<string, number> = { draft: 0, in_transit: 1, completed: 2 }

const TransferWorkflowCard = ({ t }: TransferWorkflowCardProps) => {
  // Vars
  const isCancelled = t.status === 'cancelled'
  const activeIndex = ORDER[t.status] ?? 0

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>Workflow</CardTitle>
      </CardHeader>
      <CardContent className='p-4'>
        {isCancelled ? (
          <div className='flex items-center gap-3'>
            <span className='bg-destructive/10 text-destructive grid size-9 shrink-0 place-items-center rounded-full'>
              <BanIcon className='size-4.5' />
            </span>
            <div>
              <p className='text-sm font-semibold'>Cancelled</p>
              <p className='text-muted-foreground text-xs'>This transfer was cancelled and will not be dispatched.</p>
            </div>
          </div>
        ) : (
          <ol className='space-y-4'>
            {STEPS.map((step, index) => {
              const isDone = index < activeIndex
              const isCurrent = index === activeIndex
              const isActive = isDone || isCurrent

              return (
                <li key={step.key} className='flex items-center gap-3'>
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isDone ? <CheckIcon className='size-4.5' /> : <step.icon className='size-4.5' />}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${isActive ? '' : 'text-muted-foreground'}`}>{step.label}</p>
                    <p className='text-muted-foreground text-xs'>
                      {isDone ? 'Completed' : isCurrent ? 'Current' : 'Pending'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

export default TransferWorkflowCard
