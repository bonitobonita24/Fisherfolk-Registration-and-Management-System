'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { type Control } from 'react-hook-form'
import { CheckCircle2Icon } from 'lucide-react'

// Type Imports
import type { CreateVehicleFormInput } from '../vehicle-form-schema'
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import AssignmentSection from './assignment-section'
import CapacitySpecsSection from './capacity-specs-section'
import ComplianceDocumentsSection from './compliance-documents-section'
import VehicleInformationSection from './vehicle-information-section'
import VehicleSummarySidebar from '../vehicle-summary-sidebar'

// Props
type EditVehicleViewProps = {
  control: Control<CreateVehicleFormInput>
  vehicle: Vehicle
  warehouses: Warehouse[]
  drivers: Driver[]
  onSaveChanges: () => void
}

const EditVehicleView = ({ control, vehicle, warehouses, drivers, onSaveChanges }: EditVehicleViewProps) => {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Edit Vehicle</h1>
          <p className='text-muted-foreground mt-1 text-sm'>Update vehicle information and operational settings.</p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' render={<Link href={`/fleet/${vehicle.id}`} />} nativeButton={false}>
            Cancel
          </Button>
          <Button type='button' onClick={onSaveChanges}>
            <CheckCircle2Icon className='size-4' />
            Save changes
          </Button>
        </div>
      </div>

      <div className='relative grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='grid grid-cols-1 gap-6 lg:max-xl:grid-cols-2'>
          <VehicleInformationSection control={control} />
          <CapacitySpecsSection control={control} />
          <AssignmentSection control={control} warehouses={warehouses} drivers={drivers} vehicleId={vehicle.id} />
          <ComplianceDocumentsSection control={control} />
        </div>

        <aside className='xl:sticky xl:top-18 xl:self-start'>
          <VehicleSummarySidebar
            control={control}
            mode='edit'
            vehicle={vehicle}
            warehouses={warehouses}
            drivers={drivers}
          />
        </aside>
      </div>
    </div>
  )
}

export default EditVehicleView
