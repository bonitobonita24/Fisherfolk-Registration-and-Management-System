'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { Product } from '@/types/entities/product'

// Component Imports
import ProductsPageHeader from './page-header'
import ProductsTable from './table/products-table'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'

type ProductsViewProps = {
  products: Product[]
}

const ProductsView = ({ products }: ProductsViewProps) => {
  // Hooks
  const initialize = useProductsStore(state => state.initialize)

  useEffect(() => {
    initialize(products)
  }, [initialize, products])

  return (
    <div className='space-y-6'>
      <ProductsPageHeader />
      <ProductsTable />
    </div>
  )
}

export default ProductsView
