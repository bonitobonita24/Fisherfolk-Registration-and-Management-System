// Component Imports
import FleetView from '@/views/fleet'

// Server Action Imports
import { getDriversData, getVehiclesData, getWarehousesData } from '@/app/server/actions'

const FleetPage = async () => {
  const [vehicles, drivers, warehouses] = await Promise.all([getVehiclesData(), getDriversData(), getWarehousesData()])

  return <FleetView vehicles={vehicles} drivers={drivers} warehouses={warehouses} />
}

export default FleetPage
