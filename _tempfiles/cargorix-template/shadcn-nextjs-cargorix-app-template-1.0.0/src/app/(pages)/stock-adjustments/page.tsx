// Component Imports
import StockAdjustmentsView from '@/views/stock-adjustments'

// Server Action Imports
import { getStockAdjustmentsData, getStockLedgerData, getWarehousesData } from '@/app/server/actions'

const StockAdjustmentsPage = async () => {
  const [adjustments, movements, warehouses] = await Promise.all([
    getStockAdjustmentsData(),
    getStockLedgerData(),
    getWarehousesData()
  ])

  return <StockAdjustmentsView adjustments={adjustments} movements={movements} warehouses={warehouses} />
}

export default StockAdjustmentsPage
