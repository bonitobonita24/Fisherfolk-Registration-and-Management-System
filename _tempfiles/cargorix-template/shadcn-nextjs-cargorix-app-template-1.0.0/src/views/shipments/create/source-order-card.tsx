// Next Imports
import Link from 'next/link'

// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { Order } from '@/types/entities/order'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type SourceOrderCardProps = {
  order: Order
}

const SourceOrderCard = ({ order }: SourceOrderCardProps) => {
  const totalQty = order.packages.reduce((sum, p) => sum + p.quantity, 0)
  const totalWeight = order.packages.reduce((sum, p) => sum + p.weightKg, 0)

  return (
    <Card className='lg:max-xl:col-span-2'>
      <CardContent className='space-y-4 p-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <h2 className='font-semibold'>Source order {order.displayId}</h2>
              <Badge className='bg-success-soft text-success'>Ready</Badge>
            </div>
            <p className='text-muted-foreground mt-1 text-sm'>
              ${order.totalAmount.toFixed(2)} · {order.pickupAddress} → {order.deliveryAddress}
            </p>
          </div>
          <Button variant='outline' render={<Link href={`/orders/${order.id}`} />} nativeButton={false}>
            View order
          </Button>
        </div>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4'>
          <div className='bg-muted rounded-xl p-3'>
            <p className='text-muted-foreground text-xs'>Packages</p>
            <p className='mt-1 text-sm font-semibold'>
              {totalQty} · {totalWeight.toLocaleString()} kg
            </p>
          </div>
          <div className='bg-muted rounded-xl p-3'>
            <p className='text-muted-foreground text-xs'>Requested pickup</p>
            <p className='mt-1 text-sm font-semibold'>
              {order.requestedPickupAt ? format(new Date(order.requestedPickupAt), 'd MMM · HH:mm') : '—'}
            </p>
          </div>
          <div className='bg-muted rounded-xl p-3'>
            <p className='text-muted-foreground text-xs'>Required delivery</p>
            <p className='mt-1 text-sm font-semibold'>
              {order.requiredDeliveryAt ? format(new Date(order.requiredDeliveryAt), 'd MMM · HH:mm') : '—'}
            </p>
          </div>
          <div className='bg-muted rounded-xl p-3'>
            <p className='text-muted-foreground text-xs'>Service</p>
            <p className='mt-1 text-sm font-semibold capitalize'>{order.serviceLevel.replace('_', ' ')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SourceOrderCard
