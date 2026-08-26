'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { type Control, type UseFormSetValue } from 'react-hook-form'
import { FileTextIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { CreateRouteFormInput } from '../route-form-schema'
import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Route } from '@/types/entities/route'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import AssignResourcesCard from '../assign-resources-card'
import ReadinessChecklist from '../readiness-checklist'
import RoutePreviewCard from '../route-preview-card'
import RouteSummaryCard from '../route-summary-card'
import StopSequenceList from '../stop-sequence-list'
import UnassignedStopsPanel from '../unassigned-stops-panel'

// Props
type AddRouteViewProps = {
  control: Control<CreateRouteFormInput>
  setValue: UseFormSetValue<CreateRouteFormInput>
  route: Route
  warehouse?: Warehouse
  vehicle?: Vehicle
  orders: Order[]
  vehicles: Vehicle[]
  drivers: Driver[]
  warehouses: Warehouse[]
  onSaveDraft: () => void
  onDispatch: () => void
}

const AddRouteView = ({
  control,
  setValue,
  route,
  warehouse,
  vehicle,
  orders,
  vehicles,
  drivers,
  warehouses,
  onSaveDraft,
  onDispatch
}: AddRouteViewProps) => {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Plan Route</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Pick unassigned orders, sequence the stops, then assign a vehicle and driver.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' render={<Link href='/route-planner' />} nativeButton={false}>
            Cancel
          </Button>
          <Button type='button' variant='outline' onClick={onSaveDraft}>
            <FileTextIcon className='size-4' />
            Save draft
          </Button>
          <Button type='button' onClick={onDispatch}>
            <TruckIcon className='size-4' />
            Dispatch route
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-[380px_minmax(0,1fr)_340px]'>
        <UnassignedStopsPanel routeId={route.id} orders={orders} warehouse={warehouse} />

        <div className='min-w-0 space-y-6'>
          <RoutePreviewCard route={route} warehouse={warehouse} />
          <StopSequenceList route={route} warehouse={warehouse} />
        </div>

        <div className='space-y-6'>
          <AssignResourcesCard
            control={control}
            setValue={setValue}
            vehicles={vehicles}
            drivers={drivers}
            warehouses={warehouses}
          />
          <RouteSummaryCard route={route} warehouse={warehouse} vehicle={vehicle} />
          <ReadinessChecklist route={route} />
        </div>
      </div>
    </div>
  )
}

export default AddRouteView
