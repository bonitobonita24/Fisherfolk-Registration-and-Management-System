'use client'

// Third-party Imports
import { useWatch, type Control } from 'react-hook-form'
import { CheckCircle2Icon, CircleIcon } from 'lucide-react'

// Type Imports
import type { CreateVehicleFormInput } from './vehicle-form-schema'
import type { Driver } from '@/types/entities/driver'
import type { FuelType, Vehicle, VehicleOperationalStatus, VehicleType } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { getVehicleReadiness } from '@/lib/selectors/fleet-selectors'
import { FUEL_TYPE_LABEL, VEHICLE_STATUS_BADGE, VEHICLE_TYPE_LABEL } from '../vehicle-badges'

// Props
type VehicleSummarySidebarProps = {
  control: Control<CreateVehicleFormInput>
  mode: 'add' | 'edit'
  vehicle?: Vehicle
  warehouses: Warehouse[]
  drivers: Driver[]
}

const VehicleSummarySidebar = ({ control, mode, vehicle, warehouses, drivers }: VehicleSummarySidebarProps) => {
  // Hooks
  const values = useWatch({ control })

  // Vars
  const capacityKg = Number(values.capacityKg) || 0
  const warehouse = warehouses.find(item => item.id === values.homeWarehouseId)
  const status = (values.operationalStatus as VehicleOperationalStatus) || 'draft'
  const statusBadge = VEHICLE_STATUS_BADGE[status] ?? VEHICLE_STATUS_BADGE.draft
  const typeLabel = values.type ? VEHICLE_TYPE_LABEL[values.type as VehicleType] : 'Not selected'
  const fuelLabel = values.fuelType ? FUEL_TYPE_LABEL[values.fuelType as FuelType] : '—'

  const readinessDraft: Partial<Vehicle> = {
    type: values.type ? (values.type as VehicleType) : undefined,
    registrationNo: values.registrationNo,
    make: values.make,
    model: values.model,
    year: Number(values.year) || undefined,
    homeWarehouseId: values.homeWarehouseId,
    capacityTons: capacityKg ? capacityKg / 1000 : undefined,
    operationalStatus: values.operationalStatus ? (values.operationalStatus as VehicleOperationalStatus) : undefined,
    complianceDocs: [values.insuranceExpiry, values.registrationExpiry, values.inspectionExpiry, values.permitNumber]
      .filter(Boolean)
      .map(() => ({ type: 'insurance', number: '', issuedOn: '', expiry: '' }))
  }

  const checklist = getVehicleReadiness(readinessDraft)

  const assignment = vehicle?.currentAssignment
  const assignedDriver = drivers.find(driver => driver.id === vehicle?.assignedDriverId)

  const summaryRows = [
    { label: 'Vehicle type', value: typeLabel },
    { label: 'Registration', value: values.registrationNo || 'Not set' },
    { label: 'Make / Model', value: [values.make, values.model].filter(Boolean).join(' ') || 'Not set' },
    { label: 'Year', value: values.year ? String(values.year) : '—' },
    { label: 'Fuel type', value: fuelLabel },
    { label: 'Home warehouse', value: warehouse?.name || 'Not selected' },
    { label: 'Capacity', value: capacityKg ? `${capacityKg.toLocaleString()} kg` : '—' }
  ]

  return (
    <div className='grid h-fit grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-1'>
      <Card className='gap-0 py-0'>
        <CardHeader className='flex flex-wrap items-center justify-between px-5 pt-5'>
          <CardTitle>Vehicle summary</CardTitle>
          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
        </CardHeader>
        <CardContent className='space-y-3 p-4 text-sm'>
          {summaryRows.map(row => (
            <div key={row.label} className='flex items-baseline justify-between gap-4'>
              <span className='text-muted-foreground'>{row.label}</span>
              <span className='truncate text-right font-medium'>{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Readiness checklist</CardTitle>
        </CardHeader>
        <CardContent className='p-4 text-sm'>
          <ul className='space-y-2'>
            {checklist.map(item => (
              <li key={item.label} className='flex items-center gap-2'>
                {item.done ? (
                  <CheckCircle2Icon className='text-success size-4 shrink-0' />
                ) : (
                  <CircleIcon className='text-muted-foreground size-4 shrink-0' />
                )}
                <span className={item.done ? '' : 'text-muted-foreground'}>{item.label}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {mode === 'edit' && (
        <Card className='gap-0 py-0'>
          <CardHeader className='px-5 pt-5'>
            <CardTitle>Current assignment</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 p-4 text-sm'>
            {assignment ? (
              <>
                <div className='flex items-baseline justify-between gap-4'>
                  <span className='text-muted-foreground'>Route</span>
                  <span className='truncate text-right font-medium'>{assignment.routeName}</span>
                </div>
                <div className='flex items-baseline justify-between gap-4'>
                  <span className='text-muted-foreground'>Shipment</span>
                  <span className='truncate text-right font-medium'>{assignment.shipmentName}</span>
                </div>
                <Separator />
                <div className='flex items-baseline justify-between gap-4'>
                  <span className='text-muted-foreground'>Next stop</span>
                  <span className='truncate text-right font-medium'>{assignment.nextStop}</span>
                </div>
                <div className='flex items-baseline justify-between gap-4'>
                  <span className='text-muted-foreground'>ETA</span>
                  <span className='truncate text-right font-medium'>{assignment.etaLabel}</span>
                </div>
                <div className='flex items-baseline justify-between gap-4'>
                  <span className='text-muted-foreground'>Driver</span>
                  <span className='truncate text-right font-medium'>{assignedDriver?.name || '—'}</span>
                </div>
              </>
            ) : (
              <p className='text-muted-foreground'>No active assignment for this vehicle.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default VehicleSummarySidebar
