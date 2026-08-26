// Type Imports
import type { RankedBar } from '@/types/pages/reports-types'

// Component Imports
import { Progress } from '@/components/ui/progress'

// Util Imports
import { cn } from '@/lib/utils'

type RankedBarListProps = {
  rows: RankedBar[]
  formatValue: (row: RankedBar) => string
  emptyLabel: string
  showRank?: boolean
  barClassName?: string
}

const RankedBarList = ({ rows, formatValue, emptyLabel, showRank = false, barClassName }: RankedBarListProps) => {
  if (rows.length === 0) {
    return <p className='text-muted-foreground py-6 text-center text-sm'>{emptyLabel}</p>
  }

  return (
    <div className='flex flex-col gap-4'>
      {rows.map((row, index) => (
        <div key={row.id} className='flex items-center gap-3'>
          {showRank && (
            <span className='bg-muted text-muted-foreground grid size-6 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums'>
              {index + 1}
            </span>
          )}
          <div className='min-w-0 flex-1'>
            <div className='flex items-center justify-between gap-3'>
              <span className='truncate text-sm font-medium' title={row.label}>
                {row.label}
              </span>
              <span className='shrink-0 text-sm font-semibold tabular-nums'>{formatValue(row)}</span>
            </div>
            <div className='mt-1.5 flex items-center gap-3'>
              <Progress
                value={row.percent}
                className={cn('flex-1 **:data-[slot=progress-track]:h-1.5', barClassName)}
              />
              {row.caption && (
                <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>{row.caption}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default RankedBarList
