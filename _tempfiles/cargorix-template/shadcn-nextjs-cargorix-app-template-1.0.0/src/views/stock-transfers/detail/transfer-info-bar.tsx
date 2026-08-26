// Third-party Imports
import { format } from 'date-fns'
import { ArrowRightIcon, CalendarIcon, UserIcon, WarehouseIcon } from 'lucide-react'

// Type Imports
import type { StockTransfer } from '@/types/entities/stock-transfer'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

// Util Imports
import { TRANSFER_STATUS_BADGE } from '../transfer-badges'

type TransferInfoBarProps = {
  t: StockTransfer
}

const TransferInfoBar = ({ t }: TransferInfoBarProps) => {
  // Vars
  const statusBadge = TRANSFER_STATUS_BADGE[t.status]

  const stats: { label: string; value: string; icon: typeof UserIcon }[] = [
    { label: 'Requested by', value: t.requestedBy || '—', icon: UserIcon },
    {
      label: 'Created date',
      value: t.createdAt ? format(new Date(t.createdAt), 'd MMM yyyy') : '—',
      icon: CalendarIcon
    },
    {
      label: 'Expected arrival',
      value: t.expectedArrival ? format(new Date(t.expectedArrival), 'd MMM yyyy') : '—',
      icon: CalendarIcon
    }
  ]

  return (
    <Card size='sm'>
      <CardContent className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
        <div className='flex items-center gap-3'>
          <span className='bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-full'>
            <WarehouseIcon className='size-4.5' />
          </span>
          <div className='min-w-0'>
            <p className='text-muted-foreground text-xs'>Source → Destination</p>
            <p className='flex items-center gap-1.5 truncate text-sm font-semibold'>
              <span className='truncate'>{t.sourceWarehouseName || '—'}</span>
              <ArrowRightIcon className='text-muted-foreground size-3.5 shrink-0' />
              <span className='truncate'>{t.destinationWarehouseName || '—'}</span>
            </p>
          </div>
        </div>
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
          <div className='min-w-0'>
            <p className='text-muted-foreground text-xs'>Status</p>
            <Badge className={`mt-1 ${statusBadge.className}`}>{statusBadge.label}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TransferInfoBar
