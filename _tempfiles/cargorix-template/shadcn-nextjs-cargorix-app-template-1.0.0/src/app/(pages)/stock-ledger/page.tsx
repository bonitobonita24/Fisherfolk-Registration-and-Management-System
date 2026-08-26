// Component Imports
import StockLedgerView from '@/views/stock-ledger'

// Server Action Imports
import { getStockLedgerData } from '@/app/server/actions'

const StockLedgerPage = async () => {
  const movements = await getStockLedgerData()

  return <StockLedgerView movements={movements} />
}

export default StockLedgerPage
