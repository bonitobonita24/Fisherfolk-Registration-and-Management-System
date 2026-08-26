// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { getCapacityKg } from '@/lib/selectors/fleet-selectors'

// Data Imports
import { FUEL_TYPE_LABEL, VEHICLE_TYPE_LABEL } from '../vehicle-badges'

type VehicleInformationCardProps = {
  vehicle: Vehicle
  warehouseName?: string
}

const dash = (value?: string | number | null) =>
  value === undefined || value === null || value === '' ? '—' : String(value)

const titleCase = (value?: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : '—')

const VehicleInformationCard = ({ vehicle, warehouseName }: VehicleInformationCardProps) => {
  // Vars
  const makeModel = `${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim()

  const rows: { label: string; value: string }[] = [
    { label: 'Type', value: VEHICLE_TYPE_LABEL[vehicle.type] },
    { label: 'Registration No.', value: dash(vehicle.registrationNo) },
    { label: 'Make / Model', value: makeModel || '—' },
    { label: 'Year', value: dash(vehicle.year) },
    { label: 'Fuel Type', value: vehicle.fuelType ? FUEL_TYPE_LABEL[vehicle.fuelType] : '—' },
    { label: 'Capacity', value: `${getCapacityKg(vehicle).toLocaleString()} kg` },
    { label: 'Home Warehouse', value: dash(warehouseName) },
    { label: 'VIN', value: dash(vehicle.vin) },
    { label: 'Engine No.', value: dash(vehicle.engineNo) },
    { label: 'Transmission', value: titleCase(vehicle.transmission) },
    { label: 'Emission', value: dash(vehicle.emissionStandard) },
    { label: 'Dimensions', value: dash(vehicle.dimensions) }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Information</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {rows.map(row => (
            <div key={row.label} className='space-y-1'>
              <dt className='text-muted-foreground text-xs'>{row.label}</dt>
              <dd className='text-sm font-medium'>{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

export default VehicleInformationCard
