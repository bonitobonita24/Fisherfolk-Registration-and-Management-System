// Component Imports
import StockTransferDetailView from '@/views/stock-transfers/detail'

// Server Action Imports
import { getStockLedgerData, getStockTransfersData, getWarehousesData } from '@/app/server/actions'

type StockTransferDetailPageProps = {
  params: Promise<{ transferId: string }>
}

const StockTransferDetailPage = async ({ params }: StockTransferDetailPageProps) => {
  const { transferId } = await params

  const [transfers, movements, warehouses] = await Promise.all([
    getStockTransfersData(),
    getStockLedgerData(),
    getWarehousesData()
  ])

  return (
    <StockTransferDetailView
      transferId={transferId}
      transfers={transfers}
      movements={movements}
      warehouses={warehouses}
    />
  )
}

export default StockTransferDetailPage
