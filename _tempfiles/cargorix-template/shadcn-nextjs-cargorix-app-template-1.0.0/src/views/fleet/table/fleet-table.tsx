'use client'

// React Imports
import { useMemo } from 'react'

// Component Imports
import getFleetColumns from './columns'

// Shared Imports
import EntityTable from '@/components/shared/entity-table'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { isDraftId } from '@/lib/is-draft-id'
import { MAINTENANCE_STATUS_OPTIONS, buildFleetExport } from '@/lib/selectors/fleet-selectors'

// Data Imports
import {
  VEHICLE_STATUS_BADGE,
  VEHICLE_STATUS_FILTER_OPTIONS,
  VEHICLE_TYPE_LABEL,
  VEHICLE_TYPE_OPTIONS
} from '../vehicle-badges'

const FleetTable = () => {
  // Vars
  const vehicles = useVehiclesStore(state => state.vehicles)
  const drivers = useDriversStore(state => state.drivers)
  const warehouses = useWarehousesStore(state => state.warehouses)

  const data = useMemo(() => vehicles.filter(v => !v.isDraft || v.registrationNo), [vehicles])

  const driverNameById = useMemo(() => Object.fromEntries(drivers.map(d => [d.id, d.name])), [drivers])
  const warehouseNameById = useMemo(() => Object.fromEntries(warehouses.map(w => [w.id, w.name])), [warehouses])

  const columns = useMemo(
    () => getFleetColumns({ driverNameById, warehouseNameById }),
    [driverNameById, warehouseNameById]
  )

  const warehouseOptions = useMemo(() => {
    const homed = new Set(vehicles.map(v => v.homeWarehouseId).filter(Boolean))

    return [
      { label: 'All warehouses', value: 'all' },
      ...warehouses.filter(w => homed.has(w.id)).map(w => ({ label: w.name, value: w.id }))
    ]
  }, [warehouses, vehicles])

  const filters = useMemo(
    () => [
      {
        columnId: 'status',
        label: 'Filter by status',
        placeholder: 'All statuses',
        options: VEHICLE_STATUS_FILTER_OPTIONS
      },
      { columnId: 'type', label: 'Filter by vehicle type', placeholder: 'All types', options: VEHICLE_TYPE_OPTIONS },
      {
        columnId: 'homeWarehouse',
        label: 'Filter by home warehouse',
        placeholder: 'All warehouses',
        width: 'w-44',
        options: warehouseOptions
      },
      {
        columnId: 'maintenanceStatus',
        label: 'Filter by maintenance status',
        placeholder: 'All maintenance',
        width: 'w-44',
        options: MAINTENANCE_STATUS_OPTIONS
      }
    ],
    [warehouseOptions]
  )

  // Hooks
  const table = useEntityTable({
    data,
    columns,
    getRowId: row => row.id,
    initialVisibility: { maintenanceStatus: false }
  })

  return (
    <EntityTable
      table={table}
      columnCount={columns.length}
      noun='vehicles'
      emptyMessage='No vehicles found.'
      rowHref={row => `/fleet/${row.id}`}
      rowLabel={row => `Open vehicle ${isDraftId(row.id) ? (row.registrationNo ?? '') : row.id}`}
      search={{ columnId: 'vehicle', label: 'Search vehicles' }}
      filters={filters}
      exportAs={{
        filename: 'fleet',
        title: 'Fleet',
        build: rows =>
          buildFleetExport(rows, {
            drivers,
            warehouses,
            getTypeLabel: vehicle => VEHICLE_TYPE_LABEL[vehicle.type],
            getStatusLabel: vehicle =>
              VEHICLE_STATUS_BADGE[vehicle.isDraft ? 'draft' : (vehicle.operationalStatus ?? 'available')].label
          })
      }}
    />
  )
}

export default FleetTable
