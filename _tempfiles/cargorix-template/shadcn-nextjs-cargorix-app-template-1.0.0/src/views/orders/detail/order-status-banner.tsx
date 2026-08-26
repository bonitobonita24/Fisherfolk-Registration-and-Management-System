// Third-party Imports
import { CircleSlashIcon, TriangleAlertIcon } from 'lucide-react'

// Type Imports
import type { OrderStatus } from '@/types/entities/order'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'

const BANNER_BY_STATUS = {
  cancelled: {
    icon: CircleSlashIcon,
    title: 'This order has been cancelled',
    description: 'No further shipments or changes can be made.',
    cardClassName: 'bg-destructive/10',
    iconClassName: 'text-destructive'
  },
  on_hold: {
    icon: TriangleAlertIcon,
    title: 'This order is on hold',
    description: 'Shipments and dispatch are paused until the hold is cleared.',
    cardClassName: 'bg-warning-soft',
    iconClassName: 'text-warning'
  }
} as const

type OrderStatusBannerProps = {
  status: OrderStatus
}

const OrderStatusBanner = ({ status }: OrderStatusBannerProps) => {
  const banner = status === 'cancelled' || status === 'on_hold' ? BANNER_BY_STATUS[status] : null

  if (!banner) return null

  const Icon = banner.icon

  return (
    <Card size='sm' className={banner.cardClassName}>
      <CardContent className='flex items-center gap-4'>
        <Icon className={`size-6 shrink-0 ${banner.iconClassName}`} />
        <div>
          <p className='text-sm font-semibold'>{banner.title}</p>
          <p className='text-muted-foreground mt-0.5 text-sm'>{banner.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderStatusBanner
