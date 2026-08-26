// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type VehicleNotesCardProps = {
  vehicle: Vehicle
}

const VehicleNotesCard = ({ vehicle }: VehicleNotesCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Notes</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        <p className='text-sm'>{vehicle.notes || 'No notes added for this vehicle.'}</p>
        <p className='text-muted-foreground text-xs'>Updated 22 May 2026</p>
      </CardContent>
    </Card>
  )
}

export default VehicleNotesCard
