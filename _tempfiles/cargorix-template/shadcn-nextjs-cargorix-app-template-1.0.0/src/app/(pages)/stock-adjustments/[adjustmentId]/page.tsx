// Component Imports
import StockAdjustmentDetailView from '@/views/stock-adjustments/detail'

// Server Action Imports
import { getProductsData, getStockAdjustmentsData, getStockLedgerData, getWarehousesData } from '@/app/server/actions'

type StockAdjustmentDetailPageProps = {
  params: Promise<{ adjustmentId: string }>
}

const StockAdjustmentDetailPage = async ({ params }: StockAdjustmentDetailPageProps) => {
  const { adjustmentId } = await params

  const [adjustments, movements, products, warehouses] = await Promise.all([
    getStockAdjustmentsData(),
    getStockLedgerData(),
    getProductsData(),
    getWarehousesData()
  ])

  return (
    <StockAdjustmentDetailView
      adjustmentId={adjustmentId}
      adjustments={adjustments}
      movements={movements}
      products={products}
      warehouses={warehouses}
    />
  )
}

export default StockAdjustmentDetailPage
