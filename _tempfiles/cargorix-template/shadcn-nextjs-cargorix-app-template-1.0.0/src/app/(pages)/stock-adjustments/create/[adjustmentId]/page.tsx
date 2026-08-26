// Component Imports
import CreateStockAdjustmentView from '@/views/stock-adjustments/create'

// Server Action Imports
import { getProductsData, getStockAdjustmentsData, getStockLedgerData, getWarehousesData } from '@/app/server/actions'

type CreateStockAdjustmentPageProps = {
  params: Promise<{ adjustmentId: string }>
}

const CreateStockAdjustmentPage = async ({ params }: CreateStockAdjustmentPageProps) => {
  const { adjustmentId } = await params

  const [adjustments, warehouses, products, movements] = await Promise.all([
    getStockAdjustmentsData(),
    getWarehousesData(),
    getProductsData(),
    getStockLedgerData()
  ])

  return (
    <CreateStockAdjustmentView
      adjustmentId={adjustmentId}
      adjustments={adjustments}
      warehouses={warehouses}
      products={products}
      movements={movements}
    />
  )
}

export default CreateStockAdjustmentPage
