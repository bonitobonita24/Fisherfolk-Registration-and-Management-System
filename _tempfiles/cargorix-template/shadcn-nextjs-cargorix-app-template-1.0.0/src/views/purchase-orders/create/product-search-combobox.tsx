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
  locked?: boolean
}

const ProductSearchCombobox = ({ products, existingProductIds, onAdd, locked }: ProductSearchComboboxProps) => {
  // States
  const [open, setOpen] = useState(false)

  // Vars
  const availableProducts = products.filter(product => !existingProductIds.includes(product.id))

  const handleSelect = (product: Product) => {
    onAdd(product)
    setOpen(false)
  }

  if (locked) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            className='text-muted-foreground w-full justify-start gap-2 border-dashed font-normal'
          />
        }
      >
        <SearchIcon className='size-4 shrink-0' />
        Search products by name or SKU to add
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
