// Third-party Imports
import { format } from 'date-fns'
import { BuildingIcon, CalendarIcon, UserIcon, WarehouseIcon } from 'lucide-react'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

// Util Imports
import { PO_STATUS_BADGE } from '../po-badges'

type PoInfoBarProps = {
  po: PurchaseOrder
}

const PoInfoBar = ({ po }: PoInfoBarProps) => {
  // Vars
  const statusBadge = PO_STATUS_BADGE[po.status]

  const stats: { label: string; value: string; icon: typeof BuildingIcon }[] = [
    { label: 'Supplier', value: po.supplier.name || '—', icon: BuildingIcon },
    { label: 'Destination warehouse', value: po.warehouseName || '—', icon: WarehouseIcon },
    {
      label: 'Expected delivery',
      value: po.expectedDeliveryDate ? format(new Date(po.expectedDeliveryDate), 'd MMM yyyy') : '—',
      icon: CalendarIcon
    },
    { label: 'Created by', value: po.buyer || '—', icon: UserIcon }
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
          <div className='min-w-0'>
            <p className='text-muted-foreground text-xs'>Status</p>
            <Badge className={`mt-1 ${statusBadge.className}`}>{statusBadge.label}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PoInfoBar
