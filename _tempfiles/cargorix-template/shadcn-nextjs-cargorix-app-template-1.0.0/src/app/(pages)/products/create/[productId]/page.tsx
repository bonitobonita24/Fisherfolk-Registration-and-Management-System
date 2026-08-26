// Component Imports
import CreateProductView from '@/views/products/create'

// Server Action Imports
import { getProductsData, getWarehousesData } from '@/app/server/actions'

type CreateProductPageProps = {
  params: Promise<{ productId: string }>
}

const CreateProductPage = async ({ params }: CreateProductPageProps) => {
  const { productId } = await params
  const [products, warehouses] = await Promise.all([getProductsData(), getWarehousesData()])

  return <CreateProductView productId={productId} products={products} warehouses={warehouses} />
}

export default CreateProductPage
