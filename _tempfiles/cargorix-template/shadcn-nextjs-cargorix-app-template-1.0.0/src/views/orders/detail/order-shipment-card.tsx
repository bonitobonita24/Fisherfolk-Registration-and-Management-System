'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { PackageSearchIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type OrderShipmentCardProps = {
  order: Order
  shipment?: Shipment
  onCreateShipment: () => void
}

const OrderShipmentCard = ({ order, shipment, onCreateShipment }: OrderShipmentCardProps) => {
  // Hooks
  const router = useRouter()

  // Vars
  const canCreate = order.status === 'ready_for_shipment'
  const count = shipment ? 1 : 0

  return (
    <Card className='py-0'>
      <CardHeader className='flex justify-between gap-4 border-b p-4 max-sm:flex-col'>
        <div>
          <CardTitle>Associated shipments</CardTitle>
          <p className='text-muted-foreground text-sm'>Operational records created from this order</p>
        </div>
        <CardAction>
          <Badge variant='outline'>
            {count} shipment{count === 1 ? '' : 's'}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='border-border bg-muted/30 rounded-xl border border-dashed p-8 text-center'>
          {shipment ? (
            <div className='mx-auto max-w-md space-y-3'>
              <span className='bg-primary text-primary-foreground mx-auto grid size-14 place-items-center rounded-full'>
                <TruckIcon className='size-6' />
              </span>
              <CardTitle>{shipment.displayId}</CardTitle>
              <p className='text-muted-foreground text-sm'>
                Packages, pickup schedule, driver and vehicle are managed on the shipment record.
              </p>
              <Button onClick={() => router.push(`/shipments/${shipment.id}`)}>View shipment</Button>
            </div>
          ) : (
            <div className='mx-auto max-w-md space-y-3'>
              <span className='bg-background text-muted-foreground ring-border mx-auto grid size-14 place-items-center rounded-full ring-1'>
                <PackageSearchIcon className='size-6' />
              </span>
              <CardTitle>No shipment created yet</CardTitle>
              <p className='text-muted-foreground text-sm'>
                Create a shipment to select packages, schedule pickup, assign a driver and vehicle, and generate
                tracking.
              </p>
              {canCreate && <Button onClick={onCreateShipment}>Create shipment</Button>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderShipmentCard
