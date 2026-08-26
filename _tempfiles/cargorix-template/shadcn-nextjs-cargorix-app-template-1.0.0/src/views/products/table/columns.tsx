'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { ImageIcon, PinIcon, PinOffIcon } from 'lucide-react'

// Type Imports
import type { Product } from '@/types/entities/product'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'
import ProductRowActions from './product-row-actions'

// Store Imports
import { useProductsTableStore } from '@/store/use-products-table-store'

// Util Imports
import { computeProductAvailable, getProductDisplayStatus } from '@/lib/selectors/products-selectors'

// Data Imports
import { PRODUCT_DISPLAY_STATUS_BADGE } from '../product-badges'

const PinCell = ({ product }: { product: Product }) => {
  const pinnedProductIds = useProductsTableStore(state => state.pinnedProductIds)
  const pinProduct = useProductsTableStore(state => state.pinProduct)
  const unpinProduct = useProductsTableStore(state => state.unpinProduct)
  const isPinned = pinnedProductIds.includes(product.id)

  return (
    <Button
      variant='ghost'
      size='icon'
      className='size-8'
      aria-label={isPinned ? `Unpin ${product.name}` : `Pin ${product.name}`}
      onClick={e => {
        e.stopPropagation()
        if (isPinned) unpinProduct(product.id)
        else pinProduct(product.id)
      }}
    >
      {isPinned ? <PinIcon className='size-4' /> : <PinOffIcon className='text-muted-foreground size-4' />}
    </Button>
  )
}

const getProductColumns = (): ColumnDef<Product>[] => [
  {
    id: 'pin',
    size: 40,
    enableSorting: false,
    enableHiding: false,
    header: () => null,
    cell: ({ row }) => <PinCell product={row.original} />
  },
  {
    id: 'product',
    accessorKey: 'name',
    meta: { filterVariant: 'text', label: 'Product' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const product = row.original

      return product.name.toLowerCase().includes(search) || product.sku.toLowerCase().includes(search)
    },
    cell: ({ row }) => {
      const product = row.original

      return (
        <div className='flex items-center gap-3'>
          {product.primaryImage ? (
            <img
              src={product.primaryImage}
              alt={product.name}
              loading='lazy'
              className='bg-muted size-10 shrink-0 rounded-md object-cover'
            />
          ) : (
            <div className='bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md'>
              <ImageIcon className='size-4' />
            </div>
          )}
          <div>
            <p className='font-medium'>{product.name}</p>
            <p className='text-muted-foreground mt-0.5 text-xs'>{product.shortDescription}</p>
          </div>
        </div>
      )
    }
  },
  {
    id: 'sku',
    accessorKey: 'sku',
    meta: { label: 'SKU' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='SKU' />
  },
  {
    id: 'category',
    accessorKey: 'category',
    meta: { filterVariant: 'select', label: 'Category' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Category' />,
    cell: ({ row }) => <Badge variant='outline'>{row.original.category}</Badge>
  },
  {
    id: 'onHand',
    accessorKey: 'onHand',
    meta: { label: 'On hand' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='On hand' />
  },
  {
    id: 'reserved',
    accessorKey: 'reserved',
    meta: { label: 'Reserved' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Reserved' />
  },
  {
    id: 'available',
    accessorFn: row => computeProductAvailable(row),
    meta: { label: 'Available' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Available' />,
    cell: ({ row }) => <span className='font-semibold'>{computeProductAvailable(row.original)}</span>
  },
  {
    id: 'price',
    accessorKey: 'price',
    meta: { label: 'Price' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Price' />,
    cell: ({ row }) => <span className='tabular-nums'>${row.original.price.toFixed(2)}</span>
  },
  {
    id: 'status',
    accessorFn: row => getProductDisplayStatus(row),
    meta: { filterVariant: 'select', label: 'Status' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    cell: ({ row }) => {
      const status = PRODUCT_DISPLAY_STATUS_BADGE[getProductDisplayStatus(row.original)]

      return <Badge className={status.className}>{status.label}</Badge>
    }
  },
  {
    id: 'actions',
    size: 60,
    enableHiding: false,
    enableSorting: false,
    meta: { label: 'Actions' },
    header: () => <span className='text-muted-foreground text-sm font-medium'>Actions</span>,
    cell: ({ row }) => <ProductRowActions product={row.original} />
  }
]

export default getProductColumns
