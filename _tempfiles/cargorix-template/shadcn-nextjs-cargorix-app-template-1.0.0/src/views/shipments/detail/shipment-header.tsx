'use client'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { format } from 'date-fns'
import { ChevronDownIcon, FileTextIcon, PrinterIcon, SendIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'

// Data Imports
import { SHIPMENT_STATUS_BADGE } from '../shipment-badges'

type ShipmentHeaderProps = {
  shipment: Shipment
  order?: Order
}

const ShipmentHeader = ({ shipment, order }: ShipmentHeaderProps) => {
  // Hooks
  const router = useRouter()
  const dispatchShipment = useShipmentsStore(state => state.dispatchShipment)
  const markOutForDelivery = useShipmentsStore(state => state.markOutForDelivery)
  const markDelivered = useShipmentsStore(state => state.markDelivered)
  const updateOrderStatus = useOrdersStore(state => state.updateOrderStatus)

  const handleDelivered = () => {
    markDelivered(shipment.id)
    if (order) updateOrderStatus(order.id, 'completed')
  }

  let action: React.ReactNode = null

  if (shipment.status === 'scheduled') {
    action = (
      <Button className='gap-2' onClick={() => dispatchShipment(shipment.id)}>
        <SendIcon data-icon='inline-start' />
        Dispatch
      </Button>
    )
  } else if (shipment.status === 'in_transit') {
    action = <Button onClick={() => markOutForDelivery(shipment.id)}>Mark out for delivery</Button>
  } else if (shipment.status === 'out_for_delivery') {
    action = <Button onClick={handleDelivered}>Mark delivered</Button>
  }

  return (
    <div className='flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-start sm:justify-between'>
      <div>
        <div className='flex flex-wrap items-center gap-2'>
          <h2 className='text-lg font-bold'>Shipment {shipment.displayId}</h2>
          <Badge className={SHIPMENT_STATUS_BADGE[shipment.status].className}>
            {SHIPMENT_STATUS_BADGE[shipment.status].label}
          </Badge>
        </div>
        <p className='text-muted-foreground mt-1 text-sm'>
          Created from order{' '}
          {order ? (
            <Link href={`/orders/${order.id}`} className='text-primary font-semibold hover:underline'>
              {order.displayId}
            </Link>
          ) : (
            '—'
          )}{' '}
          · {format(new Date(shipment.createdAt), 'd MMM yyyy, HH:mm')}
        </p>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        {action}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant='secondary' className='gap-2' />}>
            Actions
            <ChevronDownIcon data-icon='inline-end' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuItem disabled={!order} onClick={() => order && router.push(`/orders/${order.id}`)}>
              <FileTextIcon data-icon='inline-start' />
              View source order
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => toast('Printing labels')}>
              <PrinterIcon data-icon='inline-start' />
              Print labels
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default ShipmentHeader
