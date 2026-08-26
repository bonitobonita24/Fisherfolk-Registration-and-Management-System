'use client'

// React Imports
import { useMemo } from 'react'

// Third-party Imports
import { PinOffIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import DataTable from './data-table'
import getProductColumns from './columns'

// Shared Imports
import TablePagination from '@/components/shared/table-pagination'
import TableToolbar from '@/components/shared/table-toolbar'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { useProductsTableStore } from '@/store/use-products-table-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { buildProductsExport, getProductDisplayStatus } from '@/lib/selectors/products-selectors'

// Data Imports
import { PRODUCT_CATEGORY_OPTIONS, PRODUCT_DISPLAY_STATUS_BADGE, PRODUCT_STOCK_STATUS_OPTIONS } from '../product-badges'

const FILTERS = [
  {
    columnId: 'category',
    label: 'Filter by category',
    placeholder: 'All categories',
    width: 'w-55',
    options: PRODUCT_CATEGORY_OPTIONS
  },
  {
    columnId: 'status',
    label: 'Filter by status',
    placeholder: 'All statuses',
    options: PRODUCT_STOCK_STATUS_OPTIONS
  }
]

const ProductsTable = () => {
  // Vars
  const products = useProductsStore(state => state.products)
  const pinnedProductIds = useProductsTableStore(state => state.pinnedProductIds)
  const unpinAll = useProductsTableStore(state => state.unpinAll)

  const columns = useMemo(() => getProductColumns(), [])

  const pinnedRowIds = useMemo(
    () => pinnedProductIds.filter(id => products.some(p => p.id === id)),
    [pinnedProductIds, products]
  )

  const liveRows = useMemo(() => products.filter(p => !p.isDraft), [products])

  // Hooks
  const table = useEntityTable({
    data: liveRows,
    columns,
    getRowId: row => row.id,
    pinnedRowIds
  })

  return (
    <Card className='gap-0 py-0'>
      <TableToolbar
        table={table}
        search={{ columnId: 'product', label: 'Search products' }}
        filters={FILTERS}
        exportAs={{
          filename: 'products',
          title: 'Products',
          build: rows =>
            buildProductsExport(rows, product => PRODUCT_DISPLAY_STATUS_BADGE[getProductDisplayStatus(product)].label)
        }}
        extra={
          pinnedProductIds.length > 0 && (
            <div className='flex flex-wrap items-center gap-2 max-lg:order-1'>
              <Button variant='outline' size='sm' className='gap-1.5' onClick={unpinAll}>
                <PinOffIcon className='size-4' />
                Unpin all
              </Button>
              <span className='bg-muted text-muted-foreground rounded-full px-2.5 py-1.5 text-sm'>
                {pinnedProductIds.length} products pinned
              </span>
            </div>
          )
        }
      />
      <DataTable table={table} columnCount={columns.length} />
      <TablePagination table={table} noun='products' />
    </Card>
  )
}

export default ProductsTable
