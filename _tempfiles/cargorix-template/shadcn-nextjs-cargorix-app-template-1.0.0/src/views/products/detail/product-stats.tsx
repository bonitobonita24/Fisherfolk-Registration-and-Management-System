// Third-party Imports
import { BookmarkIcon, BoxIcon, CircleCheckIcon } from 'lucide-react'

// Type Imports
import type { Product } from '@/types/entities/product'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'

// Util Imports
import { computeProductAvailable } from '@/lib/selectors/products-selectors'

type ProductStatsProps = {
  product: Product
}

const ProductStats = ({ product }: ProductStatsProps) => {
  // Vars
  const available = computeProductAvailable(product)

  const stats = [
    {
      label: 'On hand',
      value: product.onHand,
      caption: 'Stock available',
      icon: BoxIcon,
      className: 'bg-info-soft text-info'
    },
    {
      label: 'Reserved',
      value: product.reserved,
      caption: 'Reserved stock',
      icon: BookmarkIcon,
      className: 'bg-warning-soft text-warning'
    },
    {
      label: 'Available',
      value: available,
      caption: 'Ready to sell',
      icon: CircleCheckIcon,
      className: 'bg-success-soft text-success'
    }
  ]

  return (
    <div className='grid gap-4 sm:grid-cols-3'>
      {stats.map(stat => {
        const Icon = stat.icon

        return (
          <Card key={stat.label} size='sm'>
            <CardContent className='flex items-center gap-4'>
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${stat.className}`}>
                <Icon className='size-6' />
              </span>
              <div className='min-w-0'>
                <p className='text-muted-foreground text-sm'>{stat.label}</p>
                <p className='text-2xl font-bold tabular-nums'>{stat.value}</p>
                <p className='text-muted-foreground text-xs'>{stat.caption}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default ProductStats
