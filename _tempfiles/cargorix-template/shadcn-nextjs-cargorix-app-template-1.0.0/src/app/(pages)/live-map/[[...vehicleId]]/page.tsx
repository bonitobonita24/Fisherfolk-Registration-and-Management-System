// Component Imports
import LiveMapView from '@/views/live-map'

// Server Action Imports
import { getDriversData, getVehiclesData } from '@/app/server/actions'

type LiveMapPageProps = {
  params: Promise<{ vehicleId?: string[] }>
}

const LiveMapPage = async ({ params }: LiveMapPageProps) => {
  const { vehicleId } = await params

  const [vehicles, drivers] = await Promise.all([getVehiclesData(), getDriversData()])

  return <LiveMapView vehicles={vehicles} drivers={drivers} selectedVehicleId={vehicleId?.[0]} />
}

export default LiveMapPage
