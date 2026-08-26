// Component Imports
import RoutePlannerView from '@/views/route-planner'

// Server Action Imports
import {
  getDriversData,
  getOrdersData,
  getRoutesData,
  getShipmentsData,
  getVehiclesData,
  getWarehousesData
} from '@/app/server/actions'

const RoutePlannerPage = async () => {
  const [routes, orders, shipments, vehicles, drivers, warehouses] = await Promise.all([
    getRoutesData(),
    getOrdersData(),
    getShipmentsData(),
    getVehiclesData(),
    getDriversData(),
    getWarehousesData()
  ])

  return (
    <RoutePlannerView
      routes={routes}
      orders={orders}
      shipments={shipments}
      vehicles={vehicles}
      drivers={drivers}
      warehouses={warehouses}
    />
  )
}

export default RoutePlannerPage
