// Component Imports
import CreatePurchaseOrderView from '@/views/purchase-orders/create'

// Server Action Imports
import { getProductsData, getPurchaseOrdersData, getSuppliersData, getWarehousesData } from '@/app/server/actions'

type CreatePurchaseOrderPageProps = {
  params: Promise<{ poId: string }>
  searchParams: Promise<{ productId?: string | string[] }>
}

const CreatePurchaseOrderPage = async ({ params, searchParams }: CreatePurchaseOrderPageProps) => {
  const { poId } = await params
  const { productId } = await searchParams

  const seedProductIds = productId ? (Array.isArray(productId) ? productId : [productId]) : []

  const [suppliers, products, warehouses, purchaseOrders] = await Promise.all([
    getSuppliersData(),
    getProductsData(),
    getWarehousesData(),
    getPurchaseOrdersData()
  ])

  return (
    <CreatePurchaseOrderView
      poId={poId}
      seedProductIds={seedProductIds}
      suppliers={suppliers}
      products={products}
      warehouses={warehouses}
      purchaseOrders={purchaseOrders}
    />
  )
}

export default CreatePurchaseOrderPage
