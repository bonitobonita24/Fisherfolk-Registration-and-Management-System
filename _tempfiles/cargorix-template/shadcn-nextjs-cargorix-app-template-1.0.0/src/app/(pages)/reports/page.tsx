// Component Imports
import ReportsView from '@/views/reports'

// Server Action Imports
import {
  getClientsData,
  getOrdersData,
  getProductsData,
  getRoutesData,
  getShipmentsData,
  getStockLedgerData,
  getVehiclesData,
  getWarehousesData
} from '@/app/server/actions'

const ReportsPage = async () => {
  const [orders, shipments, clients, products, movements, vehicles, routes, warehouses] = await Promise.all([
    getOrdersData(),
    getShipmentsData(),
    getClientsData(),
    getProductsData(),
    getStockLedgerData(),
    getVehiclesData(),
    getRoutesData(),
    getWarehousesData()
  ])

  return (
    <ReportsView
      orders={orders}
      shipments={shipments}
      clients={clients}
      products={products}
      movements={movements}
      vehicles={vehicles}
      routes={routes}
      warehouses={warehouses}
    />
  )
}

export default ReportsPage
