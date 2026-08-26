// Component Imports
import ProductsView from '@/views/products'

// Server Action Imports
import { getProductsData } from '@/app/server/actions'

const ProductsPage = async () => {
  const products = await getProductsData()

  return <ProductsView products={products} />
}

export default ProductsPage
