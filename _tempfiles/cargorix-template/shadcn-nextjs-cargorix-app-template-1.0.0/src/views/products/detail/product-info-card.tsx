// Third-party Imports
import { InfoIcon } from 'lucide-react'

// Type Imports
import type { Product } from '@/types/entities/product'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ProductInfoCardProps = {
  product: Product
}

const ProductInfoCard = ({ product }: ProductInfoCardProps) => {
  // Vars
  const rows = [
    { label: 'SKU', value: product.sku || '—' },
    { label: 'Barcode', value: product.barcode || '—' },
    { label: 'Category', value: product.category },
    { label: 'Brand', value: product.brand || '—' },
    { label: 'Unit', value: product.unit }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <InfoIcon className='text-muted-foreground size-4' />
          Product information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          <div className='space-y-3'>
            {rows.map(row => (
              <div key={row.label} className='flex items-center justify-between gap-4 text-sm'>
                <span className='text-muted-foreground'>{row.label}</span>
                <span className='font-medium'>{row.value}</span>
              </div>
            ))}
          </div>
          <div className='border-t pt-4'>
            <p className='text-muted-foreground text-xs'>Description</p>
            <p className='mt-1 text-sm leading-relaxed'>{product.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductInfoCard
