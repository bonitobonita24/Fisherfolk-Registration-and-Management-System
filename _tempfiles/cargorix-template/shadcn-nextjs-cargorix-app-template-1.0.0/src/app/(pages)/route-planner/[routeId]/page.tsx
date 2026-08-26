// Component Imports
import RouteDetailView from '@/views/route-planner/detail'

// Server Action Imports
import {
  getDriversData,
  getOrdersData,
  getRoutesData,
  getShipmentsData,
  getVehiclesData,
  getWarehousesData
} from '@/app/server/actions'

type RouteDetailPageProps = {
  params: Promise<{ routeId: string }>
}

const RouteDetailPage = async ({ params }: RouteDetailPageProps) => {
  const { routeId } = await params

  const [routes, orders, shipments, vehicles, drivers, warehouses] = await Promise.all([
    getRoutesData(),
    getOrdersData(),
    getShipmentsData(),
    getVehiclesData(),
    getDriversData(),
    getWarehousesData()
  ])

  return (
    <RouteDetailView
      routeId={routeId}
      routes={routes}
      orders={orders}
      shipments={shipments}
      vehicles={vehicles}
      drivers={drivers}
      warehouses={warehouses}
    />
  )
}

export default RouteDetailPage
