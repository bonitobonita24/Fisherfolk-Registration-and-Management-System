'use client'

// Third-party Imports
import { useWatch, type Control } from 'react-hook-form'
import { CheckCircle2Icon } from 'lucide-react'

// Type Imports
import type { CreateShipmentFormInput } from './create-shipment-schema'
import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'

type ShipmentSummarySidebarProps = {
  control: Control<CreateShipmentFormInput>
  order: Order
  drivers: Driver[]
  vehicles: Vehicle[]
  shipmentDisplayId: string
}

const ShipmentSummarySidebar = ({
  control,
  order,
  drivers,
  vehicles,
  shipmentDisplayId
}: ShipmentSummarySidebarProps) => {
  const values = useWatch({ control })
  const driver = drivers.find(d => d.id === values.driverId)
  const vehicle = vehicles.find(v => v.id === values.vehicleId)
  const totalQty = order.packages.reduce((sum, p) => sum + p.quantity, 0)

  return (
    <Card>
      <CardContent className='space-y-4 p-4'>
        <div className='flex items-center justify-between'>
          <h2 className='font-semibold'>Shipment summary</h2>
          <span className='bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs font-semibold'>
            {shipmentDisplayId}
          </span>
        </div>
        <div className='space-y-3 text-sm'>
          <div className='flex justify-between gap-4'>
            <span className='text-muted-foreground'>Source order</span>
            <span className='font-semibold'>{order.displayId}</span>
          </div>
          <div className='flex justify-between gap-4'>
            <span className='text-muted-foreground'>Packages</span>
            <span className='font-semibold'>{totalQty}</span>
          </div>
          <div className='flex justify-between gap-4'>
            <span className='text-muted-foreground'>Driver</span>
            <span className='font-semibold'>{driver?.name ?? 'Not assigned'}</span>
          </div>
          <div className='flex justify-between gap-4'>
            <span className='text-muted-foreground'>Vehicle</span>
            <span className='font-semibold'>{vehicle?.id ?? 'Not assigned'}</span>
          </div>
          <div className='flex justify-between gap-4'>
            <span className='text-muted-foreground'>Tracking</span>
            <span className='text-success font-semibold'>{values.sendTrackingLink ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
        <div className='space-y-2 border-t pt-4 text-sm'>
          <p className='flex items-center gap-2'>
            <CheckCircle2Icon className='text-success size-4' />
            Order data copied
          </p>
          <p className='flex items-center gap-2'>
            <CheckCircle2Icon className='text-success size-4' />
            All packages included
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default ShipmentSummarySidebar
