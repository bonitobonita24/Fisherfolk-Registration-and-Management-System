// Component Imports
import WarehousesView from '@/views/warehouses'

// Server Action Imports
import {
  getProductsData,
  getStockLedgerData,
  getStockTransfersData,
  getUsersData,
  getWarehousesData
} from '@/app/server/actions'

const WarehousesPage = async () => {
  const [warehouses, products, movements, transfers, users] = await Promise.all([
    getWarehousesData(),
    getProductsData(),
    getStockLedgerData(),
    getStockTransfersData(),
    getUsersData()
  ])

  return (
    <WarehousesView
      warehouses={warehouses}
      products={products}
      movements={movements}
      transfers={transfers}
      users={users}
    />
  )
}

export default WarehousesPage
