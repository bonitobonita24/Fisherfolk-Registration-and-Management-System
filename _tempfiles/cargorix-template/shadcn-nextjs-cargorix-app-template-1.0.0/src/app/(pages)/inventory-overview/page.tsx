// Component Imports
import InventoryOverviewView from '@/views/dashboards/inventory-overview'

// Server Action Imports
import { getInventoryOverviewData, getProductsData, getStockLedgerData, getWarehousesData } from '@/app/server/actions'

const InventoryOverviewPage = async () => {
  const [data, products, warehouses, movements] = await Promise.all([
    getInventoryOverviewData(),
    getProductsData(),
    getWarehousesData(),
    getStockLedgerData()
  ])

  return <InventoryOverviewView data={data} products={products} warehouses={warehouses} movements={movements} />
}

export default InventoryOverviewPage
