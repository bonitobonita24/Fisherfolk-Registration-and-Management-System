// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const EM_DASH = '—'

type PoSupplierInfoCardProps = {
  po: PurchaseOrder
}

const PoSupplierInfoCard = ({ po }: PoSupplierInfoCardProps) => {
  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>Supplier info</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 p-4 text-sm'>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Name</span>
          <span className='truncate text-right font-medium'>{po.supplier.name || EM_DASH}</span>
        </div>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Contact</span>
          <span className='truncate text-right font-medium'>{po.supplier.contactPerson || EM_DASH}</span>
        </div>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Email</span>
          <span className='truncate text-right font-medium'>{po.supplier.email || EM_DASH}</span>
        </div>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-muted-foreground'>Phone</span>
          <span className='truncate text-right font-medium'>{po.supplier.phone || EM_DASH}</span>
        </div>

        <Separator />

        <div className='space-y-1'>
          <span className='text-muted-foreground'>Delivery address</span>
          <p className='font-medium whitespace-pre-line'>{po.deliveryAddress || EM_DASH}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default PoSupplierInfoCard
