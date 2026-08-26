// Component Imports
import CreateRouteView from '@/views/route-planner/create'

// Server Action Imports
import {
  getDriversData,
  getOrdersData,
  getRoutesData,
  getShipmentsData,
  getVehiclesData,
  getWarehousesData
} from '@/app/server/actions'

type CreateRoutePageProps = {
  params: Promise<{ routeId: string }>
}

const CreateRoutePage = async ({ params }: CreateRoutePageProps) => {
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
    <CreateRouteView
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

export default CreateRoutePage
