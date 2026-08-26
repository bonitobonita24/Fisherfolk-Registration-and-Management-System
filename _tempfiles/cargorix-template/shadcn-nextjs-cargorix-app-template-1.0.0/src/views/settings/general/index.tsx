'use client'

// React Imports
import { useEffect } from 'react'

// Third-party Imports
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

// Type Imports
import type { Resolver } from 'react-hook-form'

import type { GeneralSettings } from '@/types/pages/general-settings'
import type { Warehouse } from '@/types/entities/warehouse'
import type { GeneralSettingsFormInput } from './general-settings-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import BrandingCard from './branding-card'
import CompanyInformationCard from './company-information-card'
import DocumentNumberingCard from './document-numbering-card'
import OperationalDefaultsCard from './operational-defaults-card'
import RegionalPreferencesCard from './regional-preferences-card'
import UnitsMeasurementCard from './units-measurement-card'

// Store Imports
import { useGeneralSettingsStore } from '@/store/use-general-settings-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Data Imports
import { generalSettingsSchema } from './general-settings-schema'

const generalSettingsResolver = zodResolver as unknown as (
  schema: typeof generalSettingsSchema
) => Resolver<GeneralSettingsFormInput, unknown, GeneralSettingsFormInput>

// Props
type GeneralSettingsViewProps = {
  settings: GeneralSettings
  warehouses: Warehouse[]
}

const GeneralSettingsView = ({ settings, warehouses: initialWarehouses }: GeneralSettingsViewProps) => {
  // Hooks
  const initialize = useGeneralSettingsStore(state => state.initialize)
  const saveSettings = useGeneralSettingsStore(state => state.saveSettings)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const storeWarehouses = useWarehousesStore(state => state.warehouses)

  // Vars
  const warehouses = storeWarehouses.length > 0 ? storeWarehouses : initialWarehouses

  const form = useForm<GeneralSettingsFormInput, unknown, GeneralSettingsFormInput>({
    resolver: generalSettingsResolver(generalSettingsSchema),
    defaultValues: useGeneralSettingsStore.getState().settings ?? settings
  })

  const onSubmit = (values: GeneralSettingsFormInput) => {
    saveSettings(values)
    form.reset(values)
    toast.success('Settings saved')
  }

  useEffect(() => {
    initialize(settings)
  }, [initialize, settings])

  useEffect(() => {
    initializeWarehouses(initialWarehouses)
  }, [initializeWarehouses, initialWarehouses])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>General Settings</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Manage company profile, regional preferences, and operational defaults.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button type='button' variant='outline' onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type='submit'>Save changes</Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <CompanyInformationCard control={form.control} />
        <BrandingCard control={form.control} />
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <RegionalPreferencesCard control={form.control} />
        <UnitsMeasurementCard control={form.control} />
        <DocumentNumberingCard control={form.control} />
      </div>

      <OperationalDefaultsCard control={form.control} warehouses={warehouses} />
    </form>
  )
}

export default GeneralSettingsView
