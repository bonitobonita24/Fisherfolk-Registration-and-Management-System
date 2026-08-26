// Component Imports
import CreateVehicleView from '@/views/fleet/create'

// Server Action Imports
import { getDriversData, getVehiclesData, getWarehousesData } from '@/app/server/actions'

type CreateVehiclePageProps = {
  params: Promise<{ vehicleId: string }>
}

const CreateVehiclePage = async ({ params }: CreateVehiclePageProps) => {
  const { vehicleId } = await params

  const [vehicles, warehouses, drivers] = await Promise.all([getVehiclesData(), getWarehousesData(), getDriversData()])

  return <CreateVehicleView vehicleId={vehicleId} vehicles={vehicles} warehouses={warehouses} drivers={drivers} />
}

export default CreateVehiclePage
