// Third-party Imports
import { TagsIcon } from 'lucide-react'

// Type Imports
import type { Product } from '@/types/entities/product'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  product: Product
}

const TagsSpecificationsCard = ({ product }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <TagsIcon className='text-muted-foreground size-4' />
          Tags & specifications
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div>
          <p className='text-muted-foreground text-xs'>Tags</p>
          {product.tags.length > 0 ? (
            <div className='mt-2 flex flex-wrap gap-2'>
              {product.tags.map(tag => (
                <Badge key={tag} variant='secondary'>
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground mt-2'>—</p>
          )}
        </div>
        <div>
          <p className='text-muted-foreground text-xs'>Key specifications</p>
          <ul className='mt-2 space-y-1.5 text-sm'>
            {product.keySpecs.map((spec, index) => (
              <li key={index} className='flex gap-2'>
                <span className='text-muted-foreground'>•</span>
                <span>
                  {spec.label ? (
                    <>
                      <span className='text-muted-foreground'>{spec.label}: </span>
                      {spec.value}
                    </>
                  ) : (
                    spec.value
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default TagsSpecificationsCard
