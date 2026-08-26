'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { PlusIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'

const ProductsPageHeader = () => {
  // Hooks
  const router = useRouter()
  const createDraftProduct = useProductsStore(state => state.createDraftProduct)

  const handleAddProduct = () => {
    const id = crypto.randomUUID()

    createDraftProduct(id)
    router.push(`/products/create/${id}`)
  }

  return (
    <div className='flex justify-between gap-4 max-sm:flex-col sm:items-center'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Products</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Manage your catalogue, stock levels, pricing, and product availability.
        </p>
      </div>
      <Button className='gap-2' onClick={handleAddProduct}>
        <PlusIcon className='size-4' />
        Add product
      </Button>
    </div>
  )
}

export default ProductsPageHeader
