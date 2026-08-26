// Third-party Imports
import { format } from 'date-fns'
import { CalendarIcon, ClipboardListIcon, UserIcon, WarehouseIcon } from 'lucide-react'

// Type Imports
import type { StockAdjustment } from '@/types/entities/stock-adjustment'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

// Util Imports
import { ADJUSTMENT_REASON_BADGE, ADJUSTMENT_STATUS_BADGE } from '../adjustment-badges'

type AdjustmentInfoBarProps = {
  a: StockAdjustment
}

const AdjustmentInfoBar = ({ a }: AdjustmentInfoBarProps) => {
  // Vars
  const statusBadge = ADJUSTMENT_STATUS_BADGE[a.status]
  const reasonBadge = ADJUSTMENT_REASON_BADGE[a.reason]

  const stats: { label: string; value: string; icon: typeof UserIcon }[] = [
    { label: 'Warehouse', value: a.warehouseName || '—', icon: WarehouseIcon },
    { label: 'Requested by', value: a.requestedBy || '—', icon: UserIcon },
    {
      label: 'Created date',
      value: a.createdAt ? format(new Date(a.createdAt), 'd MMM yyyy') : '—',
      icon: CalendarIcon
    }
  ]

  return (
    <Card size='sm'>
      <CardContent className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
        {stats.map(stat => (
          <div key={stat.label} className='flex items-center gap-3'>
            <span className='bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-full'>
              <stat.icon className='size-4.5' />
            </span>
            <div className='min-w-0'>
              <p className='text-muted-foreground text-xs'>{stat.label}</p>
              <p className='truncate text-sm font-semibold'>{stat.value}</p>
            </div>
          </div>
        ))}
        <div className='flex items-center gap-3'>
          <span className='bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-full'>
            <ClipboardListIcon className='size-4.5' />
          </span>
          <div className='min-w-0'>
            <p className='text-muted-foreground text-xs'>Reason</p>
            <Badge className={`mt-1 ${reasonBadge.className}`}>{reasonBadge.label}</Badge>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <div className='min-w-0'>
            <p className='text-muted-foreground text-xs'>Status</p>
            <Badge className={`mt-1 ${statusBadge.className}`}>{statusBadge.label}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdjustmentInfoBar
