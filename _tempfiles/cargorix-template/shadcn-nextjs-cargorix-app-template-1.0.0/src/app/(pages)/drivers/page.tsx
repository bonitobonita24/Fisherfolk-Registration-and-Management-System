// Component Imports
import DriversView from '@/views/drivers'

// Server Action Imports
import { getDriversData, getWarehousesData } from '@/app/server/actions'

const DriversPage = async () => {
  const [drivers, warehouses] = await Promise.all([getDriversData(), getWarehousesData()])

  return <DriversView drivers={drivers} warehouses={warehouses} />
}

export default DriversPage
