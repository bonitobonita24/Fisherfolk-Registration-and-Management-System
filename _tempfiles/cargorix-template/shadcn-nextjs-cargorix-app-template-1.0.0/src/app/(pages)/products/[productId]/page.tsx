// Component Imports
import ProductDetailView from '@/views/products/detail'

// Server Action Imports
import { getProductsData, getStockLedgerData, getSuppliersData } from '@/app/server/actions'

type ProductDetailPageProps = {
  params: Promise<{ productId: string }>
}

const ProductDetailPage = async ({ params }: ProductDetailPageProps) => {
  const { productId } = await params

  const [products, suppliers, movements] = await Promise.all([
    getProductsData(),
    getSuppliersData(),
    getStockLedgerData()
  ])

  return <ProductDetailView productId={productId} products={products} suppliers={suppliers} movements={movements} />
}

export default ProductDetailPage
