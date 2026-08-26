// Component Imports
import OperationsOverviewView from '@/views/dashboards/operations-overview'

// Server Action Imports
import { getOperationsOverviewData, getOrdersData, getShipmentsData, getVehiclesData } from '@/app/server/actions'

const OperationsOverviewPage = async () => {
  const [data, vehicles, orders, shipments] = await Promise.all([
    getOperationsOverviewData(),
    getVehiclesData(),
    getOrdersData(),
    getShipmentsData()
  ])

  return <OperationsOverviewView data={data} vehicles={vehicles} orders={orders} shipments={shipments} />
}

export default OperationsOverviewPage
