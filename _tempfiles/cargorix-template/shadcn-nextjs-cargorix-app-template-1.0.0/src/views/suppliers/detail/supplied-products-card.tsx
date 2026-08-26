// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChevronRightIcon } from 'lucide-react'

// Type Imports
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SuppliedProductsCardProps = {
  supplier: Supplier
}

const SuppliedProductsCard = ({ supplier }: SuppliedProductsCardProps) => {
  // Vars
  const products = supplier.productsSupplied ?? []

  return (
    <Card>
      <CardHeader className='flex flex-wrap items-center justify-between gap-2'>
        <CardTitle>Supplied Products</CardTitle>
        <Button variant='secondary' render={<Link href='/products' />} nativeButton={false}>
          View all products
          <ChevronRightIcon />
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>No products recorded.</p>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {products.map(product => (
              <Badge key={product} variant='secondary'>
                {product}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SuppliedProductsCard
