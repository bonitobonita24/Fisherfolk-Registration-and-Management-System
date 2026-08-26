// Component Imports
import PurchaseOrderDetailView from '@/views/purchase-orders/detail'

// Server Action Imports
import { getProductsData, getPurchaseOrdersData, getStockLedgerData, getWarehousesData } from '@/app/server/actions'

type PurchaseOrderDetailPageProps = {
  params: Promise<{ poId: string }>
}

const PurchaseOrderDetailPage = async ({ params }: PurchaseOrderDetailPageProps) => {
  const { poId } = await params

  const [purchaseOrders, products, movements, warehouses] = await Promise.all([
    getPurchaseOrdersData(),
    getProductsData(),
    getStockLedgerData(),
    getWarehousesData()
  ])

  return (
    <PurchaseOrderDetailView
      poId={poId}
      purchaseOrders={purchaseOrders}
      products={products}
      movements={movements}
      warehouses={warehouses}
    />
  )
}

export default PurchaseOrderDetailPage
