'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { type Control } from 'react-hook-form'
import { CheckCircle2Icon } from 'lucide-react'

// Type Imports
import type { CreateDriverFormInput } from '../driver-form-schema'
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import AssignmentSection from '../add/assignment-section'
import ContactDetailsSection from '../add/contact-details-section'
import DocumentsSection from '../add/documents-section'
import EmergencyContactSection from '../add/emergency-contact-section'
import LicenseComplianceSection from '../add/license-compliance-section'
import PersonalInformationSection from '../add/personal-information-section'
import DriverSummarySidebar from '../driver-summary-sidebar'

// Props
type EditDriverViewProps = {
  control: Control<CreateDriverFormInput>
  driver: Driver
  vehicles: Vehicle[]
  drivers: Driver[]
  warehouses: Warehouse[]
  onSaveChanges: () => void
}

const EditDriverView = ({ control, driver, vehicles, drivers, warehouses, onSaveChanges }: EditDriverViewProps) => {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Edit Driver</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Update driver information, compliance, and assignment settings.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' render={<Link href={`/drivers/${driver.id}`} />} nativeButton={false}>
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
          <PersonalInformationSection control={control} isEdit />
          <ContactDetailsSection control={control} />
          <LicenseComplianceSection control={control} />
          <AssignmentSection
            control={control}
            vehicles={vehicles}
            warehouses={warehouses}
            drivers={drivers}
            driverId={driver.id}
          />
          <EmergencyContactSection control={control} />
          <div className='lg:max-xl:col-span-2'>
            <DocumentsSection documents={driver.documents} />
          </div>
        </div>

        <aside className='xl:sticky xl:top-18 xl:self-start'>
          <DriverSummarySidebar
            control={control}
            mode='edit'
            driver={driver}
            vehicles={vehicles}
            warehouses={warehouses}
          />
        </aside>
      </div>
    </div>
  )
}

export default EditDriverView
