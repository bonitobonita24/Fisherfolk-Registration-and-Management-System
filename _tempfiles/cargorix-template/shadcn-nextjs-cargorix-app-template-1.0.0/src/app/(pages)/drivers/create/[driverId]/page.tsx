// Component Imports
import CreateDriverView from '@/views/drivers/create'

// Server Action Imports
import { getDriversData, getVehiclesData, getWarehousesData } from '@/app/server/actions'

type CreateDriverPageProps = {
  params: Promise<{ driverId: string }>
}

const CreateDriverPage = async ({ params }: CreateDriverPageProps) => {
  const { driverId } = await params

  const [drivers, vehicles, warehouses] = await Promise.all([getDriversData(), getVehiclesData(), getWarehousesData()])

  return <CreateDriverView driverId={driverId} drivers={drivers} vehicles={vehicles} warehouses={warehouses} />
}

export default CreateDriverPage
