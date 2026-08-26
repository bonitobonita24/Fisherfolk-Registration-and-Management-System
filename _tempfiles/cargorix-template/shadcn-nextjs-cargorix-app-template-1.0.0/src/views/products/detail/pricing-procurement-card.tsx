// Third-party Imports
import { TagIcon } from 'lucide-react'

// Type Imports
import type { Product } from '@/types/entities/product'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  product: Product
  supplierName: string
}

const PricingProcurementCard = ({ product, supplierName }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <TagIcon className='text-muted-foreground size-4' />
          Pricing & procurement
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <p className='text-muted-foreground text-xs'>Cost price</p>
            <p className='mt-1 text-lg font-semibold'>${product.unitCost.toFixed(2)}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-xs'>Selling price</p>
            <p className='mt-1 text-lg font-semibold'>${product.price.toFixed(2)}</p>
          </div>
        </div>
        <div className='border-t' />
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <p className='text-muted-foreground text-xs'>Supplier</p>
            <p className='mt-1 font-medium'>{supplierName}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-xs'>Reorder level</p>
            <p className='mt-1 font-medium'>{product.reorderPoint} units</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PricingProcurementCard
