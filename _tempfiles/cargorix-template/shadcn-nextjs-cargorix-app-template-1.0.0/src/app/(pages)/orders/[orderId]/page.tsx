// Component Imports
import OrderDetailView from '@/views/orders/detail'

// Server Action Imports
import { getClientsData, getOrdersData, getRoutesData, getShipmentsData, getWarehousesData } from '@/app/server/actions'

type OrderDetailPageProps = {
  params: Promise<{ orderId: string }>
}

const OrderDetailPage = async ({ params }: OrderDetailPageProps) => {
  const { orderId } = await params

  const [orders, shipments, clients, routes, warehouses] = await Promise.all([
    getOrdersData(),
    getShipmentsData(),
    getClientsData(),
    getRoutesData(),
    getWarehousesData()
  ])

  return (
    <OrderDetailView
      orderId={orderId}
      orders={orders}
      shipments={shipments}
      clients={clients}
      routes={routes}
      warehouses={warehouses}
    />
  )
}

export default OrderDetailPage
