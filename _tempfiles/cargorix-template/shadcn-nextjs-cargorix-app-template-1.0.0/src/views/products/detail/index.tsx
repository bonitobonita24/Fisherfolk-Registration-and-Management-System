'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import {
  ArchiveIcon,
  ChevronDownIcon,
  CopyIcon,
  PackagePlusIcon,
  PencilIcon,
  SlidersHorizontalIcon
} from 'lucide-react'

// Type Imports
import type { Product } from '@/types/entities/product'
import type { StockMovement } from '@/types/entities/stock-movement'
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import AdjustStockDialog from './adjust-stock-dialog'
import InventoryByWarehouseCard from './inventory-by-warehouse-card'
import PricingProcurementCard from './pricing-procurement-card'
import ProductHero from './product-hero'
import ProductInfoCard from './product-info-card'
import ProductStats from './product-stats'
import QuickStatsCard from './quick-stats-card'
import RecentStockActivityCard from './recent-stock-activity-card'
import SalesPerformanceCard from './sales-performance-card'
import TagsSpecificationsCard from './tags-specifications-card'

// Shared Imports
import PageBreadcrumb from '@/components/shared/page-breadcrumb'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'

// Util Imports
import {
  computeProductAvailable,
  getProductActivity,
  getProductWarehouseInventory
} from '@/lib/selectors/products-selectors'

type ProductDetailViewProps = {
  productId: string
  products: Product[]
  suppliers: Supplier[]
  movements: StockMovement[]
}

const ProductDetailView = ({ productId, products, suppliers, movements }: ProductDetailViewProps) => {
  // States
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false)

  // Hooks
  const router = useRouter()
  const initialize = useProductsStore(state => state.initialize)
  const storeProduct = useProductsStore(state => state.getProduct(productId))
  const duplicateProduct = useProductsStore(state => state.duplicateProduct)
  const archiveProduct = useProductsStore(state => state.archiveProduct)

  useEffect(() => {
    initialize(products)
  }, [initialize, products])

  const product = storeProduct ?? products.find(p => p.id === productId)

  if (!product) {
    return (
      <div className='py-24 text-center'>
        <h1 className='text-xl font-semibold'>Product not found</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          This product may have been created in a different browser session and isn&apos;t available after a reload.
        </p>
        <Button className='mt-4' onClick={() => router.push('/products')}>
          Back to products
        </Button>
      </div>
    )
  }

  // Vars
  const available = computeProductAvailable(product)
  const activityRows = getProductActivity(product.id, movements)
  const inventoryRows = getProductWarehouseInventory(product, movements)

  const supplierName =
    suppliers.length > 0 ? suppliers[product.sku.charCodeAt(product.sku.length - 1) % suppliers.length].name : '—'

  const soldSum = product.salesTrend.reduce((sum, point) => sum + point.sold, 0)
  const avgDaily = product.salesTrend.length > 0 ? soldSum / product.salesTrend.length : 0

  const quickStats = {
    totalSold: soldSum,
    returns: Math.round(soldSum * 0.03),
    lowStock: available <= product.reorderPoint,
    daysOfStock: avgDaily > 0 ? Math.round(available / avgDaily) : available
  }

  const handleReorder = () => {
    router.push(`/purchase-orders/create/${crypto.randomUUID()}?productId=${product.id}`)
  }

  const handleDuplicate = () => {
    const newId = duplicateProduct(product.id)

    if (newId) router.push(`/products/create/${newId}`)
  }

  const handleArchive = () => {
    archiveProduct(product.id)
    router.push('/products')
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <PageBreadcrumb parentLabel='Products' parentHref='/products' current={product.name} />

        <div className='flex flex-wrap gap-2'>
          <Button className='gap-2' render={<Link href={`/products/create/${product.id}`} />} nativeButton={false}>
            <PencilIcon data-icon='inline-start' />
            Edit product
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='outline' className='gap-2' />}>
              Actions
              <ChevronDownIcon data-icon='inline-end' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuItem onClick={() => setIsAdjustStockOpen(true)}>
                <SlidersHorizontalIcon data-icon='inline-start' />
                Adjust stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReorder}>
                <PackagePlusIcon data-icon='inline-start' />
                Reorder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDuplicate}>
                <CopyIcon data-icon='inline-start' />
                Duplicate product
              </DropdownMenuItem>
              <DropdownMenuItem variant='destructive' onClick={handleArchive}>
                <ArchiveIcon data-icon='inline-start' />
                Archive product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ProductHero product={product} />
      <ProductStats product={product} />

      <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]'>
        <div className='space-y-6'>
          <RecentStockActivityCard rows={activityRows} />
          <InventoryByWarehouseCard rows={inventoryRows} />
          <SalesPerformanceCard product={product} />
        </div>

        <aside className='grid grid-cols-1 gap-6 md:max-lg:grid-cols-2'>
          <ProductInfoCard product={product} />
          <PricingProcurementCard product={product} supplierName={supplierName} />
          <QuickStatsCard stats={quickStats} />
          <TagsSpecificationsCard product={product} />
        </aside>
      </div>

      <AdjustStockDialog product={product} open={isAdjustStockOpen} onOpenChange={setIsAdjustStockOpen} />
    </div>
  )
}

export default ProductDetailView
