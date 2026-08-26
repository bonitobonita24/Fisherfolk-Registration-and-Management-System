'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import {
  ArchiveRestoreIcon,
  CopyIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  TrashIcon
} from 'lucide-react'

// Type Imports
import type { Product } from '@/types/entities/product'

// Component Imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { useProductsTableStore } from '@/store/use-products-table-store'

type ProductRowActionsProps = {
  product: Product
}

const ProductRowActions = ({ product }: ProductRowActionsProps) => {
  // States
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false)

  // Hooks
  const router = useRouter()
  const duplicateProduct = useProductsStore(state => state.duplicateProduct)
  const archiveProduct = useProductsStore(state => state.archiveProduct)
  const restoreProduct = useProductsStore(state => state.restoreProduct)
  const pinnedProductIds = useProductsTableStore(state => state.pinnedProductIds)
  const pinProduct = useProductsTableStore(state => state.pinProduct)
  const unpinProduct = useProductsTableStore(state => state.unpinProduct)
  const isPinned = pinnedProductIds.includes(product.id)
  const isArchived = product.status === 'archived'

  const handleDuplicate = () => {
    const newId = duplicateProduct(product.id)

    if (newId) router.push(`/products/create/${newId}`)
  }

  const handleArchive = () => {
    archiveProduct(product.id)
    setIsArchiveConfirmOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant='ghost' size='icon' className='size-8' aria-label='Product actions' />}
        >
          <MoreHorizontalIcon className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-fit'>
          <DropdownMenuItem onClick={() => router.push(`/products/${product.id}`)}>
            <EyeIcon data-icon='inline-start' />
            View product
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/products/create/${product.id}`)}>
            <PencilIcon data-icon='inline-start' />
            Edit product
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <CopyIcon data-icon='inline-start' />
            Duplicate product
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => (isPinned ? unpinProduct(product.id) : pinProduct(product.id))}>
            {isPinned ? <PinOffIcon data-icon='inline-start' /> : <PinIcon data-icon='inline-start' />}
            {isPinned ? 'Unpin product' : 'Pin product'}
          </DropdownMenuItem>
          {isArchived ? (
            <DropdownMenuItem onClick={() => restoreProduct(product.id)}>
              <ArchiveRestoreIcon data-icon='inline-start' />
              Make active
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant='destructive' onClick={() => setIsArchiveConfirmOpen(true)}>
              <TrashIcon data-icon='inline-start' />
              Archive product
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isArchiveConfirmOpen} onOpenChange={setIsArchiveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {product.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Archived products are hidden from storefronts and active listings. You can restore this product later from
              the products table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive product</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ProductRowActions
