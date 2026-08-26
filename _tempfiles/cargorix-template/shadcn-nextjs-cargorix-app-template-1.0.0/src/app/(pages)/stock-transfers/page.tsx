// Component Imports
import StockTransfersView from '@/views/stock-transfers'

// Server Action Imports
import { getStockLedgerData, getStockTransfersData, getWarehousesData } from '@/app/server/actions'

const StockTransfersPage = async () => {
  const [transfers, movements, warehouses] = await Promise.all([
    getStockTransfersData(),
    getStockLedgerData(),
    getWarehousesData()
  ])

  return <StockTransfersView transfers={transfers} movements={movements} warehouses={warehouses} />
}

export default StockTransfersPage
