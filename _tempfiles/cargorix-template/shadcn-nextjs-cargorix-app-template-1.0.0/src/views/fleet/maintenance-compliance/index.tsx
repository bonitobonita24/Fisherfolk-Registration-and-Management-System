'use client'

// React Imports
import { useMemo } from 'react'

// Component Imports
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import getMaintenanceComplianceColumns from './columns'

// Shared Imports
import DataTable from '@/components/shared/data-table'
import TablePagination from '@/components/shared/table-pagination'
import TableToolbar from '@/components/shared/table-toolbar'

// Store Imports
import { useVehiclesStore } from '@/store/use-vehicles-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { getMaintenanceComplianceRows } from '@/lib/selectors/fleet-selectors'

const MaintenanceComplianceCard = () => {
  // Vars
  const vehicles = useVehiclesStore(state => state.vehicles)

  const data = useMemo(() => getMaintenanceComplianceRows(vehicles), [vehicles])
  const columns = useMemo(() => getMaintenanceComplianceColumns(), [])

  // Hooks
  const table = useEntityTable({
    data,
    columns,
    getRowId: row => row.id
  })

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='border-b p-4'>
        <CardTitle>Maintenance & Compliance</CardTitle>
        <CardDescription>All dates and mileages are as of 22 May 2026.</CardDescription>
      </CardHeader>
      <TableToolbar
        table={table}
        search={{ columnId: 'vehicle', label: 'Search maintenance and compliance', placeholder: 'Search vehicles...' }}
        compact
      />
      <DataTable
        table={table}
        columnCount={columns.length}
        emptyMessage='No maintenance or compliance issues.'
        rowHref={row => `/fleet/${row.id}`}
        rowLabel={row => `Open vehicle ${row.id}`}
      />
      <TablePagination table={table} noun='vehicles' />
    </Card>
  )
}

export default MaintenanceComplianceCard
