// Component Imports
import ShipmentsView from '@/views/shipments'

// Server Action Imports
import {
  getClientsData,
  getDriversData,
  getOrdersData,
  getShipmentsData,
  getVehiclesData,
  getWarehousesData
} from '@/app/server/actions'

type ShipmentsPageProps = {
  params: Promise<{ shipmentId?: string[] }>
}

const ShipmentsPage = async ({ params }: ShipmentsPageProps) => {
  const { shipmentId } = await params

  const [shipments, orders, clients, drivers, vehicles, warehouses] = await Promise.all([
    getShipmentsData(),
    getOrdersData(),
    getClientsData(),
    getDriversData(),
    getVehiclesData(),
    getWarehousesData()
  ])

  return (
    <ShipmentsView
      shipments={shipments}
      orders={orders}
      clients={clients}
      drivers={drivers}
      vehicles={vehicles}
      warehouses={warehouses}
      selectedShipmentId={shipmentId?.[0]}
    />
  )
}

export default ShipmentsPage
