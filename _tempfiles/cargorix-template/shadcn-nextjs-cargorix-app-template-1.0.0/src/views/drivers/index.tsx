'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import DriversHeader from './page-header'
import DriversTable from './table/drivers-table'
import ComplianceAvailabilityCard from './compliance-availability'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type DriversViewProps = {
  drivers: Driver[]
  warehouses: Warehouse[]
}

const DriversView = ({ drivers, warehouses }: DriversViewProps) => {
  // Hooks
  const initializeDrivers = useDriversStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)

  useEffect(() => {
    initializeDrivers(drivers)
  }, [initializeDrivers, drivers])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  return (
    <div className='space-y-6'>
      <DriversHeader />
      <DriversTable />
      <ComplianceAvailabilityCard />
    </div>
  )
}

export default DriversView
