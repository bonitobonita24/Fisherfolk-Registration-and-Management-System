// Third-party Imports
import { format } from 'date-fns'
import { TruckIcon } from 'lucide-react'

// Type Imports
import type { Driver } from '@/types/entities/driver'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AssignedVehicleCardProps = {
  driver: Driver
}

const formatDate = (value?: string) => (value ? format(new Date(value), 'dd MMM yyyy') : '—')

const AssignedVehicleCard = ({ driver }: AssignedVehicleCardProps) => {
  // Vars
  const vehicle = driver.assignedVehicle

  const rows = vehicle
    ? [
        { label: 'Vehicle No', value: vehicle.vehicleNo },
        { label: 'Make / Model', value: `${vehicle.make} ${vehicle.model}`.trim() || '—' },
        { label: 'Vehicle Type', value: vehicle.typeLabel },
        { label: 'Year', value: String(vehicle.year) },
        { label: 'Capacity', value: vehicle.capacityLabel },
        { label: 'Registration Date', value: formatDate(vehicle.registrationDate) }
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Vehicle</CardTitle>
      </CardHeader>
      <CardContent>
        {vehicle ? (
          <div className='flex items-start gap-4'>
            <dl className='grid min-w-0 flex-1 grid-cols-1 gap-3 text-sm'>
              {rows.map(row => (
                <div key={row.label} className='space-y-0.5'>
                  <dt className='text-muted-foreground text-xs'>{row.label}</dt>
                  <dd className='font-medium'>{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className='bg-muted grid size-24 shrink-0 place-items-center rounded-lg'>
              <TruckIcon className='text-muted-foreground size-10' />
            </div>
          </div>
        ) : (
          <p className='text-muted-foreground text-sm'>No vehicle assigned.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default AssignedVehicleCard
