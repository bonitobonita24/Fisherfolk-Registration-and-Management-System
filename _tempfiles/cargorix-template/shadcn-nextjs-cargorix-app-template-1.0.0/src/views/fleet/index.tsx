'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import FleetHeader from './page-header'
import FleetTable from './table/fleet-table'
import MaintenanceComplianceCard from './maintenance-compliance'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type FleetViewProps = {
  vehicles: Vehicle[]
  drivers: Driver[]
  warehouses: Warehouse[]
}

const FleetView = ({ vehicles, drivers, warehouses }: FleetViewProps) => {
  // Hooks
  const initializeVehicles = useVehiclesStore(state => state.initialize)
  const initializeDrivers = useDriversStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)

  useEffect(() => {
    initializeVehicles(vehicles)
  }, [initializeVehicles, vehicles])

  useEffect(() => {
    initializeDrivers(drivers)
  }, [initializeDrivers, drivers])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  return (
    <div className='space-y-6'>
      <FleetHeader />
      <FleetTable />
      <MaintenanceComplianceCard />
    </div>
  )
}

export default FleetView
