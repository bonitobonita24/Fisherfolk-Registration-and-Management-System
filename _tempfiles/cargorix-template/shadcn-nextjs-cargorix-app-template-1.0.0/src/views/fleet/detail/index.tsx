'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { notFound } from 'next/navigation'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import AssignedDriverCard from './assigned-driver-card'
import AvailabilityStatusCard from './availability-status-card'
import CapacityUsageCard from './capacity-usage-card'
import ComplianceDocumentsCard from './compliance-documents-card'
import CurrentAssignmentCard from './current-assignment-card'
import MaintenanceHistoryCard from './maintenance-history-card'
import RecentActivityCard from './recent-activity-card'
import VehicleDetailHeader from './vehicle-detail-header'
import VehicleInformationCard from './vehicle-information-card'
import VehicleNotesCard from './vehicle-notes-card'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type FleetDetailViewProps = {
  vehicleId: string
  vehicles: Vehicle[]
  drivers: Driver[]
  warehouses: Warehouse[]
}

const FleetDetailView = ({ vehicleId, vehicles, drivers, warehouses }: FleetDetailViewProps) => {
  // Hooks
  const initializeVehicles = useVehiclesStore(state => state.initialize)
  const initializeDrivers = useDriversStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)

  const storedVehicle = useVehiclesStore(state => state.getVehicle(vehicleId))

  const vehicle = storedVehicle ?? vehicles.find(v => v.id === vehicleId)
  const driver = useDriversStore(state => state.drivers.find(d => d.id === vehicle?.assignedDriverId))
  const homeWarehouse = useWarehousesStore(state => state.warehouses.find(w => w.id === vehicle?.homeWarehouseId))

  useEffect(() => {
    initializeVehicles(vehicles)
  }, [initializeVehicles, vehicles])

  useEffect(() => {
    initializeDrivers(drivers)
  }, [initializeDrivers, drivers])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  if (!vehicle) notFound()

  return (
    <div className='relative grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
      <div className='min-w-0 space-y-6'>
        <VehicleDetailHeader vehicle={vehicle} />
        <CurrentAssignmentCard vehicle={vehicle} />
        <VehicleInformationCard vehicle={vehicle} warehouseName={homeWarehouse?.name} />
        <MaintenanceHistoryCard vehicle={vehicle} />
        <ComplianceDocumentsCard vehicle={vehicle} />
      </div>
      <aside className='grid grid-cols-1 gap-6 self-start lg:max-xl:grid-cols-2 xl:sticky xl:top-18'>
        <AssignedDriverCard vehicle={vehicle} driver={driver} />
        <AvailabilityStatusCard vehicle={vehicle} />
        <CapacityUsageCard vehicle={vehicle} />
        <VehicleNotesCard vehicle={vehicle} />
        <RecentActivityCard vehicle={vehicle} />
      </aside>
    </div>
  )
}

export default FleetDetailView
