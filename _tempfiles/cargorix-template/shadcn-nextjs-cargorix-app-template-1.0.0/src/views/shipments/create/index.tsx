'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Type Imports
import type { Resolver } from 'react-hook-form'

import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import PackagesIncludedSection from './packages-included-section'
import ResourcesSection from './resources-section'
import ScheduleRouteSection from './schedule-route-section'
import ShipmentSummarySidebar from './shipment-summary-sidebar'
import SourceOrderCard from './source-order-card'
import TrackingLabelsSection from './tracking-labels-section'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'

// Data Imports
import { createShipmentSchema } from './create-shipment-schema'

import type { CreateShipmentFormInput, CreateShipmentFormValues } from './create-shipment-schema'

const createShipmentResolver = zodResolver as unknown as (
  schema: typeof createShipmentSchema
) => Resolver<CreateShipmentFormInput, unknown, CreateShipmentFormValues>

const EMPTY_VALUES: CreateShipmentFormInput = {
  serviceLevel: 'regular',
  originHub: 'Newark Hub',
  pickupWindowStart: '',
  pickupWindowEnd: '',
  deliveryDeadline: '',
  routeType: 'Fastest route',
  driverId: '',
  vehicleId: '',
  carrier: 'Internal Fleet',
  trackingDeviceId: '',
  generateLabels: true,
  sendTrackingLink: true,
  requireProofOfDelivery: true,
  driverInstructions: ''
}

type CreateShipmentViewProps = {
  shipmentId: string
  orders: Order[]
  shipments: Shipment[]
  drivers: Driver[]
  vehicles: Vehicle[]
}

const CreateShipmentView = ({ shipmentId, orders, shipments, drivers, vehicles }: CreateShipmentViewProps) => {
  // States
  const [showSuccess, setShowSuccess] = useState(false)
  const [scheduleError, setScheduleError] = useState(false)

  // Hooks
  const router = useRouter()
  const initializeOrders = useOrdersStore(state => state.initialize)
  const initializeShipments = useShipmentsStore(state => state.initialize)
  const shipment = useShipmentsStore(state => state.getShipment(shipmentId))
  const updateShipment = useShipmentsStore(state => state.updateShipment)
  const saveShipmentDraft = useShipmentsStore(state => state.saveShipmentDraft)
  const scheduleShipment = useShipmentsStore(state => state.scheduleShipment)
  const attachShipment = useOrdersStore(state => state.attachShipment)
  const storeOrder = useOrdersStore(state => (shipment ? state.getOrder(shipment.orderId) : undefined))
  const initializeDrivers = useDriversStore(state => state.initialize)
  const initializeVehicles = useVehiclesStore(state => state.initialize)
  const storeDrivers = useDriversStore(state => state.drivers)
  const storeVehicles = useVehiclesStore(state => state.vehicles)

  useEffect(() => {
    initializeOrders(orders)
  }, [initializeOrders, orders])

  useEffect(() => {
    initializeShipments(shipments)
  }, [initializeShipments, shipments])

  useEffect(() => {
    initializeDrivers(drivers)
  }, [initializeDrivers, drivers])

  useEffect(() => {
    initializeVehicles(vehicles)
  }, [initializeVehicles, vehicles])

  // Vars
  const order = storeOrder ?? orders.find(o => o.id === shipment?.orderId)
  const driverPool = (storeDrivers.length > 0 ? storeDrivers : drivers).filter(d => !d.isDraft)
  const vehiclePool = (storeVehicles.length > 0 ? storeVehicles : vehicles).filter(v => !v.isDraft)

  const defaultValues: CreateShipmentFormInput = order
    ? {
        ...EMPTY_VALUES,
        serviceLevel: order.serviceLevel,
        pickupWindowStart: order.requestedPickupAt,
        pickupWindowEnd: order.requestedPickupAt,
        deliveryDeadline: order.requiredDeliveryAt
      }
    : EMPTY_VALUES

  const form = useForm<CreateShipmentFormInput, unknown, CreateShipmentFormValues>({
    resolver: createShipmentResolver(createShipmentSchema),
    defaultValues
  })

  useEffect(() => {
    if (order) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id])

  if (!shipment || !order) {
    return (
      <div className='py-24 text-center'>
        <h1 className='text-xl font-semibold'>Shipment draft not found</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          This draft only exists in the browser session that created it. Start again from an order&apos;s detail page.
        </p>
        <Button className='mt-4' onClick={() => router.push('/orders')}>
          Back to orders
        </Button>
      </div>
    )
  }

  const handleSaveDraft = form.handleSubmit(values => {
    saveShipmentDraft(shipmentId, values)
    router.push(`/orders/${order.id}`)
  })

  const handleCreateAndSchedule = form.handleSubmit(values => {
    updateShipment(shipmentId, values)
    const scheduled = scheduleShipment(shipmentId)

    if (!scheduled) {
      setScheduleError(true)

      return
    }

    setScheduleError(false)
    attachShipment(order.id, shipmentId)
    setShowSuccess(true)
  })

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Create shipment</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Order information is copied automatically. Add the resources and tracking details required for execution.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button type='button' variant='outline' onClick={handleSaveDraft}>
            Save draft
          </Button>
          <Button type='button' onClick={handleCreateAndSchedule}>
            Create & schedule
          </Button>
        </div>
      </div>

      {scheduleError && (
        <p className='border-warning bg-warning-soft text-warning rounded-xl border p-3 text-sm'>
          Assign a driver and vehicle before scheduling this shipment.
        </p>
      )}

      <div className='relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]'>
        <div className='grid grid-cols-1 gap-6 lg:max-xl:grid-cols-2'>
          <SourceOrderCard order={order} />
          <PackagesIncludedSection
            shipmentId={shipmentId}
            order={order}
            priorityPackageIds={shipment.priorityPackageIds}
          />
          <ScheduleRouteSection control={form.control} />
          <ResourcesSection
            control={form.control}
            setValue={form.setValue}
            drivers={driverPool}
            vehicles={vehiclePool}
            order={order}
          />
          <TrackingLabelsSection control={form.control} />
        </div>
        <aside className='grid-cols-1 max-xl:grid lg:grid-cols-2 xl:sticky xl:top-18 xl:self-start'>
          <ShipmentSummarySidebar
            control={form.control}
            order={order}
            drivers={driverPool}
            vehicles={vehiclePool}
            shipmentDisplayId={shipment.displayId}
          />
        </aside>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className='max-w-md text-center'>
          <DialogTitle>Shipment created</DialogTitle>
          <p className='text-muted-foreground text-sm'>
            {shipment.displayId} was created from order {order.displayId}. The order is now{' '}
            <strong>In fulfilment</strong>.
          </p>
          <div className='mt-4 grid grid-cols-2 gap-3'>
            <Button variant='outline' onClick={() => setShowSuccess(false)}>
              Stay here
            </Button>
            <Button onClick={() => router.push(`/shipments/${shipmentId}`)}>View shipment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreateShipmentView
