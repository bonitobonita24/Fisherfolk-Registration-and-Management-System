'use client'

// React Imports
import { useMemo } from 'react'

// Component Imports
import getRouteColumns from './columns'

// Shared Imports
import EntityTable from '@/components/shared/entity-table'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useRoutesStore } from '@/store/use-routes-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { buildRoutesExport } from '@/lib/selectors/route-selectors'

// Data Imports
import { ROUTE_STATUS_BADGE, ROUTE_STATUS_OPTIONS } from '../route-badges'
import { UNASSIGNED_FILTER_VALUE } from './columns'

const RoutesTable = () => {
  // Vars
  const routes = useRoutesStore(state => state.routes)
  const vehicles = useVehiclesStore(state => state.vehicles)
  const drivers = useDriversStore(state => state.drivers)
  const warehouses = useWarehousesStore(state => state.warehouses)

  const data = useMemo(() => routes.filter(r => !r.isDraft || Boolean(r.number)), [routes])

  const columns = useMemo(() => getRouteColumns({ vehicles, drivers, warehouses }), [vehicles, drivers, warehouses])

  const driverOptions = useMemo(() => {
    const assigned = new Set(routes.filter(r => !r.isDraft).map(r => r.driverId))

    return [
      { label: 'All drivers', value: 'all' },
      { label: 'Unassigned', value: UNASSIGNED_FILTER_VALUE },
      ...drivers.filter(d => assigned.has(d.id)).map(d => ({ label: d.name, value: d.id }))
    ]
  }, [routes, drivers])

  const vehicleOptions = useMemo(() => {
    const assigned = new Set(routes.filter(r => !r.isDraft).map(r => r.vehicleId))

    return [
      { label: 'All vehicles', value: 'all' },
      { label: 'Unassigned', value: UNASSIGNED_FILTER_VALUE },
      ...vehicles
        .filter(v => assigned.has(v.id))
        .map(v => ({ label: v.registrationNo ?? v.id.toUpperCase(), value: v.id }))
    ]
  }, [routes, vehicles])

  const filters = useMemo(
    () => [
      { columnId: 'status', label: 'Filter by status', placeholder: 'All statuses', options: ROUTE_STATUS_OPTIONS },
      {
        columnId: 'driver',
        label: 'Filter by driver',
        placeholder: 'All drivers',
        width: 'w-44',
        options: driverOptions
      },
      {
        columnId: 'vehicle',
        label: 'Filter by vehicle',
        placeholder: 'All vehicles',
        width: 'w-44',
        options: vehicleOptions
      }
    ],
    [driverOptions, vehicleOptions]
  )

  // Hooks
  const table = useEntityTable({
    data,
    columns,
    getRowId: row => row.id,
    initialSorting: [{ id: 'date', desc: true }],
    initialVisibility: { origin: false, packages: false }
  })

  return (
    <EntityTable
      table={table}
      columnCount={columns.length}
      noun='routes'
      emptyMessage='No routes found.'
      rowHref={row => (row.isDraft ? `/route-planner/create/${row.id}` : `/route-planner/${row.id}`)}
      rowLabel={row => `Open route ${row.number}`}
      search={{ columnId: 'number', label: 'Search routes' }}
      filters={filters}
      exportAs={{
        filename: 'routes',
        title: 'Routes',
        build: rows =>
          buildRoutesExport(rows, {
            drivers,
            vehicles,
            warehouses,
            getStatusLabel: route => ROUTE_STATUS_BADGE[route.status].label
          })
      }}
    />
  )
}

export default RoutesTable
