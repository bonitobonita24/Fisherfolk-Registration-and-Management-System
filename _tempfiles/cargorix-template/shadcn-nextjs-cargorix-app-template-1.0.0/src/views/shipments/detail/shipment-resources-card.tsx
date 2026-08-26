// Third-party Imports
import { TruckIcon } from 'lucide-react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ShipmentResourcesCardProps = {
  driver?: Driver
  vehicle?: Vehicle
}

const ShipmentResourcesCard = ({ driver, vehicle }: ShipmentResourcesCardProps) => {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Assigned resources</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center gap-3'>
          <span className='bg-muted grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold'>
            {driver?.initials ?? '—'}
          </span>
          <div>
            <p className='text-muted-foreground text-xs'>Driver</p>
            <p className='mt-0.5 font-semibold'>{driver?.name ?? 'Not assigned'}</p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <span className='bg-primary text-primary-foreground grid size-10 shrink-0 place-items-center rounded-full'>
            <TruckIcon className='size-5' />
          </span>
          <div>
            <p className='text-muted-foreground text-xs'>Vehicle</p>
            <p className='mt-0.5 font-semibold'>{vehicle ? `${vehicle.id} · ${vehicle.label}` : 'Not assigned'}</p>
            {vehicle && <p className='text-muted-foreground text-xs'>{vehicle.capacityTons} t capacity</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ShipmentResourcesCard
