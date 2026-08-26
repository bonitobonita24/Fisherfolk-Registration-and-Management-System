'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { PackageIcon, SearchIcon } from 'lucide-react'

// Type Imports
import type { Product } from '@/types/entities/product'

// Component Imports
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Props
type ProductSearchComboboxProps = {
  products: Product[]
  existingProductIds: string[]
  onAdd: (product: Product) => void
  disabled?: boolean
}

const ProductSearchCombobox = ({ products, existingProductIds, onAdd, disabled }: ProductSearchComboboxProps) => {
  // States
  const [open, setOpen] = useState(false)

  // Vars
  const availableProducts = products.filter(product => !existingProductIds.includes(product.id))

  const handleSelect = (product: Product) => {
    onAdd(product)
    setOpen(false)
  }

  return (
    <Popover open={open && !disabled} onOpenChange={value => setOpen(disabled ? false : value)}>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            disabled={disabled}
            className='text-muted-foreground w-full justify-start gap-2 border-dashed font-normal'
          />
        }
      >
        <SearchIcon className='size-4 shrink-0' />
        {disabled ? 'Select a source warehouse first' : 'Search by product name or SKU'}
      </PopoverTrigger>
      <PopoverContent align='start' className='w-(--anchor-width) p-0'>
        <Command>
          <CommandInput placeholder='Search products...' />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup>
              {availableProducts.map(product => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.sku}`}
                  onSelect={() => handleSelect(product)}
                >
                  <PackageIcon className='size-4 shrink-0' />
                  <span className='flex-1 truncate'>{product.name}</span>
                  <span className='text-muted-foreground text-xs'>{product.sku}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ProductSearchCombobox
