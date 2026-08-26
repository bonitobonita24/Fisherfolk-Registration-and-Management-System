// Component Imports
import FleetDetailView from '@/views/fleet/detail'

// Server Action Imports
import { getVehiclesData, getDriversData, getWarehousesData } from '@/app/server/actions'

type FleetDetailPageProps = {
  params: Promise<{ vehicleId: string }>
}

const FleetDetailPage = async ({ params }: FleetDetailPageProps) => {
  const { vehicleId } = await params

  const [vehicles, drivers, warehouses] = await Promise.all([getVehiclesData(), getDriversData(), getWarehousesData()])

  return <FleetDetailView vehicleId={vehicleId} vehicles={vehicles} drivers={drivers} warehouses={warehouses} />
}

export default FleetDetailPage
