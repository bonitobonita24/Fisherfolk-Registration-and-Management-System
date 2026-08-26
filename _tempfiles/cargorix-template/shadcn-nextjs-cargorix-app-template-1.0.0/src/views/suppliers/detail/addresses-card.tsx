// Third-party Imports
import { MapPinIcon } from 'lucide-react'

// Type Imports
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AddressesCardProps = {
  supplier: Supplier
}

const AddressesCard = ({ supplier }: AddressesCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Addresses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex items-start gap-3'>
          <span className='bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
            <MapPinIcon className='size-4' />
          </span>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <p className='text-sm font-medium'>Head office</p>
              <Badge variant='secondary'>Primary</Badge>
            </div>
            {supplier.address ? (
              <p className='text-muted-foreground mt-1 text-sm whitespace-pre-line'>{supplier.address}</p>
            ) : (
              <p className='text-muted-foreground mt-1 text-sm'>—</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AddressesCard
