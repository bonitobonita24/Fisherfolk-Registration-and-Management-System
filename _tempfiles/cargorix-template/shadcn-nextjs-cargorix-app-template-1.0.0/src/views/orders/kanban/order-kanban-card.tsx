'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { CheckCircle2Icon, PackageIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'

// Data Imports
import { ORDER_SOURCE_BADGE } from '../order-badges'

type OrderKanbanCardProps = {
  order: Order
  client?: Client
  isOverlay?: boolean
}

const OrderKanbanCard = ({ order, client, isOverlay }: OrderKanbanCardProps) => {
  // Hooks
  const router = useRouter()

  // Vars
  const totalQty = order.packages.reduce((sum, p) => sum + p.quantity, 0)

  const handleClick = () => {
    if (!isOverlay) router.push(`/orders/${order.id}`)
  }

  return (
    <Card
      role={isOverlay ? undefined : 'button'}
      tabIndex={isOverlay ? undefined : 0}
      onClick={isOverlay ? undefined : handleClick}
      onKeyDown={
        isOverlay
          ? undefined
          : e => {
              if (e.key === 'Enter' || e.key === ' ') handleClick()
            }
      }
      className={cn(
        'cursor-pointer gap-3 p-4 transition-shadow hover:shadow-md dark:shadow-black/60',
        isOverlay && 'shadow-lg'
      )}
    >
      <div className='flex items-center justify-between gap-2'>
        <span className='text-primary text-sm font-semibold'>{order.displayId}</span>
        <Badge className={ORDER_SOURCE_BADGE[order.source].className}>{ORDER_SOURCE_BADGE[order.source].label}</Badge>
      </div>

      <div className='flex items-center justify-between gap-2'>
        <div className='min-w-0'>
          <h4 className='truncate text-base font-bold'>{client?.name ?? 'Unknown client'}</h4>
          <p className='text-muted-foreground mt-2.5 text-sm leading-5'>{order.pickupAddress} →</p>
          <p className='text-muted-foreground text-sm leading-5'>{order.deliveryAddress}</p>
        </div>
        {order.status === 'completed' && <CheckCircle2Icon className='text-success size-5 shrink-0' />}
      </div>

      <div className='flex items-center justify-between gap-2'>
        <span className='text-muted-foreground flex items-center gap-1.5 text-sm'>
          <PackageIcon className='size-4' />
          {totalQty} package{totalQty === 1 ? '' : 's'}
        </span>
        <span className='text-sm font-bold tabular-nums'>${order.totalAmount.toFixed(2)}</span>
      </div>
    </Card>
  )
}

export default OrderKanbanCard
