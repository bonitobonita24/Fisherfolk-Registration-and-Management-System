// Component Imports
import DriverDetailView from '@/views/drivers/detail'

// Server Action Imports
import { getDriversData, getWarehousesData } from '@/app/server/actions'

type DriverDetailPageProps = {
  params: Promise<{ driverId: string }>
}

const DriverDetailPage = async ({ params }: DriverDetailPageProps) => {
  const { driverId } = await params

  const [drivers, warehouses] = await Promise.all([getDriversData(), getWarehousesData()])

  return <DriverDetailView driverId={driverId} drivers={drivers} warehouses={warehouses} />
}

export default DriverDetailPage
