// Type Imports
import type { User } from '@/types/entities/user'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { getUserName } from '@/lib/selectors/user-selectors'

type WarehouseDetailsCardProps = {
  warehouse: Warehouse
  users: User[]
}

const openedFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

const WarehouseDetailsCard = ({ warehouse, users }: WarehouseDetailsCardProps) => {
  // Vars
  const { addressParts } = warehouse
  const addressLine2 = `${addressParts.city}, ${addressParts.state} ${addressParts.postalCode}`.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouse details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className='space-y-3 text-sm'>
          <div className='flex items-start justify-between gap-4'>
            <dt className='text-muted-foreground'>Manager</dt>
            <dd className='text-right font-medium'>{getUserName(users, warehouse.managerId)}</dd>
          </div>
          <div className='flex items-start justify-between gap-4'>
            <dt className='text-muted-foreground'>Docks</dt>
            <dd className='text-right font-medium'>{warehouse.dockCount}</dd>
          </div>
          <div className='flex items-start justify-between gap-4'>
            <dt className='text-muted-foreground'>Address</dt>
            <dd className='text-right font-medium'>
              <p>{addressParts.line1 || warehouse.location}</p>
              <p className='text-muted-foreground font-normal'>{addressLine2}</p>
            </dd>
          </div>
          <div className='flex items-start justify-between gap-4'>
            <dt className='text-muted-foreground'>Opened</dt>
            <dd className='text-right font-medium'>{openedFormatter.format(new Date(warehouse.openedDate))}</dd>
          </div>
          <div className='flex items-start justify-between gap-4'>
            <dt className='text-muted-foreground'>Type</dt>
            <dd className='text-right font-medium'>{warehouse.type}</dd>
          </div>
          <div className='flex items-start justify-between gap-4'>
            <dt className='text-muted-foreground'>Operating hours</dt>
            <dd className='text-right font-medium'>{warehouse.operatingHours}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

export default WarehouseDetailsCard
