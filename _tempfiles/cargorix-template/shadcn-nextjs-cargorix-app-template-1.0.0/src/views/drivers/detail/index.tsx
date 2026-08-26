'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { notFound } from 'next/navigation'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import AssignedVehicleCard from './assigned-vehicle-card'
import AvailabilityShiftCard from './availability-shift-card'
import ComplianceDocumentsCard from './compliance-documents-card'
import CurrentAssignmentCard from './current-assignment-card'
import DriverDetailHeader from './driver-detail-header'
import DriverInformationCard from './driver-information-card'
import DriverNotesCard from './driver-notes-card'
import RecentActivityCard from './recent-activity-card'
import TripHistoryCard from './trip-history-card'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type DriverDetailViewProps = {
  driverId: string
  drivers: Driver[]
  warehouses: Warehouse[]
}

const DriverDetailView = ({ driverId, drivers, warehouses }: DriverDetailViewProps) => {
  // Hooks
  const initializeDrivers = useDriversStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const storeWarehouses = useWarehousesStore(state => state.warehouses)
  const storedDriver = useDriversStore(state => state.drivers.find(d => d.id === driverId))

  const driver = storedDriver ?? drivers.find(d => d.id === driverId)

  const hubOptions = storeWarehouses.length > 0 ? storeWarehouses : warehouses

  useEffect(() => {
    initializeDrivers(drivers)
  }, [initializeDrivers, drivers])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  if (!driver) notFound()

  return (
    <div className='relative grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
      <div className='min-w-0 space-y-6'>
        <DriverDetailHeader driver={driver} />
        <CurrentAssignmentCard driver={driver} />
        <DriverInformationCard driver={driver} warehouses={hubOptions} />
        <TripHistoryCard driver={driver} />
        <ComplianceDocumentsCard driver={driver} />
      </div>
      <aside className='grid grid-cols-1 gap-6 self-start md:max-lg:grid-cols-2 xl:sticky xl:top-18'>
        <AssignedVehicleCard driver={driver} />
        <AvailabilityShiftCard driver={driver} />
        <DriverNotesCard driver={driver} />
        <RecentActivityCard driver={driver} />
      </aside>
    </div>
  )
}

export default DriverDetailView
