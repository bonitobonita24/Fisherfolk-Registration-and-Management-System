'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { type Control } from 'react-hook-form'
import { FileTextIcon, UserPlusIcon } from 'lucide-react'

// Type Imports
import type { CreateDriverFormInput } from '../driver-form-schema'
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import AssignmentSection from './assignment-section'
import ContactDetailsSection from './contact-details-section'
import DocumentsSection from './documents-section'
import EmergencyContactSection from './emergency-contact-section'
import LicenseComplianceSection from './license-compliance-section'
import PersonalInformationSection from './personal-information-section'
import DriverSummarySidebar from '../driver-summary-sidebar'

// Props
type AddDriverViewProps = {
  control: Control<CreateDriverFormInput>
  vehicles: Vehicle[]
  drivers: Driver[]
  warehouses: Warehouse[]
  onSaveDraft: () => void
  onAdd: () => void
}

const AddDriverView = ({ control, vehicles, drivers, warehouses, onSaveDraft, onAdd }: AddDriverViewProps) => {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Add Driver</h1>
          <p className='text-muted-foreground mt-1 text-sm'>Create a new driver profile and assignment record.</p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' render={<Link href='/drivers' />} nativeButton={false}>
            Cancel
          </Button>
          <Button type='button' variant='outline' onClick={onSaveDraft}>
            <FileTextIcon className='size-4' />
            Save draft
          </Button>
          <Button type='button' onClick={onAdd}>
            <UserPlusIcon className='size-4' />
            Add driver
          </Button>
        </div>
      </div>

      <div className='relative grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='grid grid-cols-1 gap-6 lg:max-xl:grid-cols-2'>
          <PersonalInformationSection control={control} />
          <ContactDetailsSection control={control} />
          <LicenseComplianceSection control={control} />
          <AssignmentSection control={control} vehicles={vehicles} warehouses={warehouses} drivers={drivers} />
          <EmergencyContactSection control={control} />
          <div>
            <DocumentsSection />
          </div>
        </div>

        <aside className='xl:sticky xl:top-18 xl:self-start'>
          <DriverSummarySidebar control={control} mode='add' vehicles={vehicles} warehouses={warehouses} />
        </aside>
      </div>
    </div>
  )
}

export default AddDriverView
