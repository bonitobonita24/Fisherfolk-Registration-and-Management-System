'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { TruckIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'
import type { Route } from '@/types/entities/route'
import type { Shipment } from '@/types/entities/shipment'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import OrderActivityCard from './order-activity-card'
import OrderDetailHeader from './order-detail-header'
import OrderInfoCards from './order-info-cards'
import OrderNextStepCard from './order-next-step-card'
import OrderPackagesTable from './order-packages-table'
import OrderReadinessCard from './order-readiness-card'
import OrderRouteSection from './order-route-section'
import OrderShipmentCard from './order-shipment-card'
import OrderStatusBanner from './order-status-banner'
import OrderStepper from './order-stepper'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'
import { useRoutesStore } from '@/store/use-routes-store'
import { useShipmentsStore } from '@/store/use-shipments-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { getRouteForOrder } from '@/lib/selectors/route-selectors'

type OrderDetailViewProps = {
  orderId: string
  orders: Order[]
  shipments: Shipment[]
  clients: Client[]
  routes: Route[]
  warehouses: Warehouse[]
}

const OrderDetailView = ({ orderId, orders, shipments, clients, routes, warehouses }: OrderDetailViewProps) => {
  // Hooks
  const router = useRouter()
  const initializeOrders = useOrdersStore(state => state.initialize)
  const initializeShipments = useShipmentsStore(state => state.initialize)
  const initializeRoutes = useRoutesStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const storedWarehouses = useWarehousesStore(state => state.warehouses)
  const storedRoutes = useRoutesStore(state => state.routes)
  const storeOrder = useOrdersStore(state => state.getOrder(orderId))
  const receiveOrder = useOrdersStore(state => state.receiveOrder)
  const approveOrder = useOrdersStore(state => state.approveOrder)
  const cancelOrder = useOrdersStore(state => state.cancelOrder)
  const resumeOrder = useOrdersStore(state => state.resumeOrder)
  const holdOrder = useOrdersStore(state => state.holdOrder)
  const duplicateOrder = useOrdersStore(state => state.duplicateOrder)
  const createDraftShipment = useShipmentsStore(state => state.createDraftShipment)
  const storeShipment = useShipmentsStore(state => state.getShipmentByOrderId(orderId))

  useEffect(() => {
    initializeOrders(orders)
  }, [initializeOrders, orders])

  useEffect(() => {
    initializeShipments(shipments)
  }, [initializeShipments, shipments])

  useEffect(() => {
    initializeRoutes(routes)
  }, [initializeRoutes, routes])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  const order = storeOrder ?? orders.find(o => o.id === orderId)
  const shipment = storeShipment ?? shipments.find(s => s.orderId === orderId)
  const route = getRouteForOrder(orderId, storedRoutes.length > 0 ? storedRoutes : routes)
  const warehouseList = storedWarehouses.length > 0 ? storedWarehouses : warehouses
  const startWarehouse = warehouseList.find(w => w.id === route?.startWarehouseId)

  const handleCreateShipment = () => {
    const shipmentId = crypto.randomUUID()

    createDraftShipment(shipmentId, orderId)
    router.push(`/shipments/create/${shipmentId}`)
  }

  if (!order) {
    return (
      <div className='py-24 text-center'>
        <h1 className='text-xl font-semibold'>Order not found</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          This order may have been created in a different browser session and isn&apos;t available after a reload.
        </p>
        <Button className='mt-4' onClick={() => router.push('/orders')}>
          Back to orders
        </Button>
      </div>
    )
  }

  const client = clients.find(c => c.id === order.clientId)

  const handleConfirmOrder = () => approveOrder(order.id)

  const handleReceiveOrder = () => receiveOrder(order.id)

  const handleEdit = () => router.push(`/orders/create/${order.id}`)

  const handleEditPackages = () => router.push(`/orders/create/${order.id}?section=packages`)

  const handleDuplicate = () => {
    const newId = duplicateOrder(order.id)

    if (newId) router.push(`/orders/create/${newId}`)
  }

  const handleCancel = () => cancelOrder(order.id)

  const handleResume = () => resumeOrder(order.id)

  const handleHold = () => holdOrder(order.id)

  let primaryAction: React.ReactNode = null

  if (order.status === 'on_hold') {
    primaryAction = <Button onClick={handleResume}>Resume order</Button>
  } else if (order.status === 'pending_review') {
    primaryAction = <Button onClick={handleReceiveOrder}>Mark as received</Button>
  } else if (order.status === 'order_received') {
    primaryAction = <Button onClick={handleConfirmOrder}>Confirm order</Button>
  } else if (order.status === 'ready_for_shipment') {
    primaryAction = (
      <Button className='gap-2' onClick={handleCreateShipment}>
        <TruckIcon data-icon='inline-start' />
        Create shipment
      </Button>
    )
  } else if (order.status === 'in_fulfilment' && shipment) {
    primaryAction = (
      <Button variant='outline' onClick={() => router.push(`/shipments/${shipment.id}`)}>
        View shipment
      </Button>
    )
  }

  return (
    <div className='space-y-6'>
      <OrderDetailHeader
        order={order}
        primaryAction={primaryAction}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onCancel={handleCancel}
        onHold={handleHold}
      />

      <OrderStatusBanner status={order.status} />
      <OrderStepper order={order} shipment={shipment} />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.85fr)]'>
        <div className='min-w-0 space-y-6'>
          <OrderInfoCards order={order} client={client} />
          <OrderRouteSection order={order} route={route} startWarehouse={startWarehouse} />
          <OrderPackagesTable order={order} onEdit={handleEditPackages} />
          <OrderShipmentCard order={order} shipment={shipment} onCreateShipment={handleCreateShipment} />
        </div>
        <aside className='grid h-fit min-w-0 grid-cols-1 gap-6 md:max-xl:grid-cols-2'>
          <OrderReadinessCard order={order} onConfirm={handleConfirmOrder} onReceive={handleReceiveOrder} />
          <OrderActivityCard order={order} />
          <OrderNextStepCard
            order={order}
            shipment={shipment}
            onConfirm={handleConfirmOrder}
            onReceive={handleReceiveOrder}
            onCreateShipment={handleCreateShipment}
            onDuplicate={handleDuplicate}
          />
        </aside>
      </div>
    </div>
  )
}

export default OrderDetailView
