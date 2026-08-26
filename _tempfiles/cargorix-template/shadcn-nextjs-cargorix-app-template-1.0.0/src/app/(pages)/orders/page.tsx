// Component Imports
import OrdersView from '@/views/orders'

// Server Action Imports
import { getClientsData, getOrderKpiTrendsData, getOrdersData, getShipmentsData } from '@/app/server/actions'

const OrdersPage = async () => {
  const [orders, shipments, clients, kpiTrends] = await Promise.all([
    getOrdersData(),
    getShipmentsData(),
    getClientsData(),
    getOrderKpiTrendsData()
  ])

  return <OrdersView orders={orders} shipments={shipments} clients={clients} kpiTrends={kpiTrends} />
}

export default OrdersPage
