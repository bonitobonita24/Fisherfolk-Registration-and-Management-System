'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { type Control } from 'react-hook-form'
import { CheckCircle2Icon, FileTextIcon } from 'lucide-react'

// Type Imports
import type { CreateVehicleFormInput } from '../vehicle-form-schema'
import type { Driver } from '@/types/entities/driver'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import AssignmentSection from './assignment-section'
import CapacitySpecsSection from './capacity-specs-section'
import ComplianceDocumentsSection from './compliance-documents-section'
import VehicleInformationSection from './vehicle-information-section'
import VehicleSummarySidebar from '../vehicle-summary-sidebar'

// Props
type AddVehicleViewProps = {
  control: Control<CreateVehicleFormInput>
  warehouses: Warehouse[]
  drivers: Driver[]
  onSaveDraft: () => void
  onAdd: () => void
}

const AddVehicleView = ({ control, warehouses, drivers, onSaveDraft, onAdd }: AddVehicleViewProps) => {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Add Vehicle</h1>
          <p className='text-muted-foreground mt-1 text-sm'>Create a new fleet vehicle record.</p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' render={<Link href='/fleet' />} nativeButton={false}>
            Cancel
          </Button>
          <Button type='button' variant='outline' onClick={onSaveDraft}>
            <FileTextIcon className='size-4' />
            Save draft
          </Button>
          <Button type='button' onClick={onAdd}>
            <CheckCircle2Icon className='size-4' />
            Add vehicle
          </Button>
        </div>
      </div>

      <div className='relative grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='grid grid-cols-1 gap-6 lg:max-xl:grid-cols-2'>
          <VehicleInformationSection control={control} />
          <CapacitySpecsSection control={control} />
          <AssignmentSection control={control} warehouses={warehouses} drivers={drivers} />
          <ComplianceDocumentsSection control={control} />
        </div>

        <aside className='xl:sticky xl:top-18 xl:self-start'>
          <VehicleSummarySidebar control={control} mode='add' warehouses={warehouses} drivers={drivers} />
        </aside>
      </div>
    </div>
  )
}

export default AddVehicleView
