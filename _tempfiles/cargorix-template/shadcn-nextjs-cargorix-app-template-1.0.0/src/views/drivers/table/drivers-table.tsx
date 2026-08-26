'use client'

// React Imports
import { useMemo } from 'react'

// Component Imports
import getDriverColumns from './columns'

// Shared Imports
import EntityTable from '@/components/shared/entity-table'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { isDraftId } from '@/lib/is-draft-id'
import { LICENSE_STATUS_OPTIONS, buildDriversExport, getHomeHubName } from '@/lib/selectors/drivers-selectors'

// Data Imports
import { DRIVER_STATUS_BADGE, DRIVER_STATUS_FILTER_OPTIONS, LICENSE_CLASS_LABEL, SHIFT_LABEL } from '../driver-badges'

const DriversTable = () => {
  // Vars
  const drivers = useDriversStore(state => state.drivers)
  const warehouses = useWarehousesStore(state => state.warehouses)

  const data = useMemo(() => drivers.filter(d => !d.isDraft || d.name), [drivers])

  const columns = useMemo(() => getDriverColumns(warehouses), [warehouses])

  const filters = useMemo(
    () => [
      {
        columnId: 'status',
        label: 'Filter by status',
        placeholder: 'All statuses',
        options: DRIVER_STATUS_FILTER_OPTIONS
      },
      {
        columnId: 'homeHub',
        label: 'Filter by home hub',
        placeholder: 'All hubs',
        options: [
          { label: 'All hubs', value: 'all' },
          ...warehouses.map(warehouse => ({ label: warehouse.name, value: warehouse.id }))
        ]
      },
      {
        columnId: 'licenseSeverity',
        label: 'Filter by license status',
        placeholder: 'All license statuses',
        width: 'w-52',
        options: LICENSE_STATUS_OPTIONS
      }
    ],
    [warehouses]
  )

  // Hooks
  const table = useEntityTable({
    data,
    columns,
    getRowId: row => row.id,
    initialVisibility: { licenseSeverity: false, license: false, homeHub: false, shift: false }
  })

  return (
    <EntityTable
      table={table}
      columnCount={columns.length}
      noun='drivers'
      emptyMessage='No drivers found.'
      rowHref={row => (row.isDraft ? `/drivers/create/${row.id}` : `/drivers/${row.id}`)}
      rowLabel={row => `Open driver ${isDraftId(row.id) ? row.name : row.id}`}
      search={{ columnId: 'driver', label: 'Search drivers' }}
      filters={filters}
      exportAs={{
        filename: 'drivers',
        title: 'Drivers',
        build: rows =>
          buildDriversExport(rows, {
            getStatusLabel: driver => DRIVER_STATUS_BADGE[driver.employmentStatus ?? 'inactive'].label,
            getLicenseClassLabel: driver => (driver.licenseClass ? LICENSE_CLASS_LABEL[driver.licenseClass] : ''),
            getShiftLabel: driver => (driver.shift ? SHIFT_LABEL[driver.shift] : ''),
            getHomeHubLabel: driver => getHomeHubName(driver, warehouses)
          })
      }}
    />
  )
}

export default DriversTable
