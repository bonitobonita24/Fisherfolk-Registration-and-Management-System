// Next Imports
import Link from 'next/link'

// Third-party Imports
import { format } from 'date-fns'
import { BadgeDollarSignIcon, ChevronRightIcon, Clock3Icon, UserIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const SERVICE_LABEL: Record<Order['serviceLevel'], string> = {
  regular: 'Regular Service',
  express: 'Express Service',
  same_day: 'Same-day Service'
}

const SERVICE_TRANSIT_TIME: Record<Order['serviceLevel'], string> = {
  regular: '2–5 business days',
  express: '1–2 business days',
  same_day: 'Delivered same day'
}

type OrderInfoCardsProps = {
  order: Order
  client?: Client
}

const OrderInfoCards = ({ order, client }: OrderInfoCardsProps) => {
  return (
    <div className='grid items-stretch gap-4 md:grid-cols-3'>
      <Card size='sm' className='justify-between'>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground text-xs'>Client</p>
          <div className='flex items-center gap-3'>
            <span className='bg-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full text-sm font-medium'>
              {client?.avatarInitials ?? '—'}
            </span>
            <div className='min-w-0'>
              <Button
                variant='link'
                render={<Link href={`/clients/${order.clientId}`} />}
                nativeButton={false}
                className='text-foreground h-auto max-w-full justify-start p-0 font-semibold'
              >
                <span className='min-w-0 truncate'>{client?.name ?? 'Unknown client'}</span>
              </Button>
              <p className='text-muted-foreground truncate text-xs'>
                {client?.industry} · {order.billingAccount}
              </p>
            </div>
          </div>
          <div className='flex gap-3 border-t pt-4'>
            <UserIcon className='text-muted-foreground mt-0.5 size-4 shrink-0' />
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium'>{order.contactName}</p>
              <p className='text-muted-foreground mt-1 truncate text-xs'>{order.contactEmail}</p>
              <p className='text-muted-foreground text-xs'>{order.contactPhone}</p>
            </div>
          </div>
        </CardContent>
        <CardContent>
          <Button
            variant='outline'
            render={<Link href={`/clients/${order.clientId}`} />}
            nativeButton={false}
            className='w-full justify-between'
          >
            View client
            <ChevronRightIcon data-icon='inline-end' />
          </Button>
        </CardContent>
      </Card>

      <Card size='sm'>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground text-xs'>Requested service</p>
          <div className='flex items-start justify-between gap-3'>
            <h2 className='text-xl font-bold'>{SERVICE_LABEL[order.serviceLevel]}</h2>
            <span className='bg-info-soft text-info grid size-9 shrink-0 place-items-center rounded-full'>
              <Clock3Icon className='size-4.5' />
            </span>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <p className='text-muted-foreground text-xs'>Pickup</p>
              <p className='mt-1 text-sm font-semibold'>
                {order.requestedPickupAt ? format(new Date(order.requestedPickupAt), 'd MMM · HH:mm') : '—'}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>Required by</p>
              <p className='mt-1 text-sm font-semibold'>
                {order.requiredDeliveryAt ? format(new Date(order.requiredDeliveryAt), 'd MMM · HH:mm') : '—'}
              </p>
            </div>
          </div>
          <Badge variant='outline'>{SERVICE_TRANSIT_TIME[order.serviceLevel]}</Badge>
        </CardContent>
      </Card>

      <Card size='sm'>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground text-xs'>Order value</p>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h2 className='text-2xl font-bold'>${order.totalAmount.toFixed(2)}</h2>
              <p className='text-muted-foreground mt-1 text-xs'>{order.currency} · Tax included</p>
            </div>
            <span className='bg-success-soft text-success grid size-9 shrink-0 place-items-center rounded-full'>
              <BadgeDollarSignIcon className='size-4.5' />
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrderInfoCards
