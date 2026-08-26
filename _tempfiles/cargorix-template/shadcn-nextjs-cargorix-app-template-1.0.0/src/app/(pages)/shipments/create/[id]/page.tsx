// Component Imports
import CreateShipmentView from '@/views/shipments/create'

// Server Action Imports
import { getDriversData, getOrdersData, getShipmentsData, getVehiclesData } from '@/app/server/actions'

type CreateShipmentPageProps = {
  params: Promise<{ id: string }>
}

const CreateShipmentPage = async ({ params }: CreateShipmentPageProps) => {
  const { id: shipmentId } = await params

  const [orders, shipments, drivers, vehicles] = await Promise.all([
    getOrdersData(),
    getShipmentsData(),
    getDriversData(),
    getVehiclesData()
  ])

  return (
    <CreateShipmentView
      shipmentId={shipmentId}
      orders={orders}
      shipments={shipments}
      drivers={drivers}
      vehicles={vehicles}
    />
  )
}

export default CreateShipmentPage
