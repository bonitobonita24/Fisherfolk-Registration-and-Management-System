// Type Imports
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SERVICE_LABEL = { regular: 'Regular', express: 'Express', same_day: 'Same day' } as const

type ShipmentInfoCardProps = {
  shipment: Shipment
  order?: Order
}

const ShipmentInfoCard = ({ shipment, order }: ShipmentInfoCardProps) => {
  const totalQty = order?.packages.reduce((sum, p) => sum + p.quantity, 0) ?? 0
  const totalWeight = order?.packages.reduce((sum, p) => sum + p.weightKg, 0) ?? 0

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Shipment information</CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-2 gap-4 text-sm'>
        <div>
          <p className='text-muted-foreground text-xs'>Shipment ID</p>
          <p className='mt-1 font-semibold'>{shipment.displayId}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs'>Order</p>
          <p className='mt-1 font-semibold'>{order?.displayId ?? '—'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs'>Origin hub</p>
          <p className='mt-1 font-semibold'>{shipment.originHub}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs'>Service</p>
          <p className='mt-1 font-semibold'>{SERVICE_LABEL[shipment.serviceLevel]}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs'>Distance</p>
          <p className='mt-1 font-semibold'>{shipment.distanceKm} km</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs'>Packages</p>
          <p className='mt-1 font-semibold'>
            {totalQty} · {totalWeight.toLocaleString()} kg
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default ShipmentInfoCard
