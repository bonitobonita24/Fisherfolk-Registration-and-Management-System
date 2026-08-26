'use client'

// React Imports
import { useMemo } from 'react'

// Component Imports
import getClientColumns from './columns'

// Shared Imports
import EntityTable from '@/components/shared/entity-table'

// Store Imports
import { useClientsStore } from '@/store/use-clients-store'
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { buildClientsExport } from '@/lib/selectors/client-selectors'

// Data Imports
import { CLIENT_STATUS_OPTIONS } from '../client-badges'

const ClientsTable = () => {
  // Vars
  const clients = useClientsStore(state => state.clients)
  const orders = useOrdersStore(state => state.orders)
  const shipments = useShipmentsStore(state => state.shipments)

  const data = useMemo(() => clients.filter(c => !c.isDraft), [clients])

  const columns = useMemo(() => getClientColumns(orders, shipments), [orders, shipments])

  const locationOptions = useMemo(
    () => [
      { label: 'All locations', value: 'all' },
      ...Array.from(new Set(data.map(c => c.state).filter(Boolean)))
        .sort()
        .map(state => ({ label: state as string, value: state as string }))
    ],
    [data]
  )

  const managerOptions = useMemo(
    () => [
      { label: 'All managers', value: 'all' },
      ...Array.from(new Set(data.map(c => c.accountManager).filter(Boolean)))
        .sort()
        .map(manager => ({ label: manager as string, value: manager as string }))
    ],
    [data]
  )

  const filters = useMemo(
    () => [
      { columnId: 'status', label: 'Filter by status', placeholder: 'All statuses', options: CLIENT_STATUS_OPTIONS },
      { columnId: 'location', label: 'Filter by location', placeholder: 'All locations', options: locationOptions },
      {
        columnId: 'accountManager',
        label: 'Filter by account manager',
        placeholder: 'All managers',
        width: 'w-44',
        options: managerOptions
      }
    ],
    [locationOptions, managerOptions]
  )

  // Hooks
  const table = useEntityTable({
    data,
    columns,
    getRowId: row => row.id,
    initialVisibility: { accountManager: false }
  })

  return (
    <EntityTable
      table={table}
      columnCount={columns.length}
      noun='clients'
      emptyMessage='No clients found.'
      rowHref={row => `/clients/${row.id}`}
      rowLabel={row => `Open client ${row.id}`}
      search={{ columnId: 'client', label: 'Search clients' }}
      filters={filters}
      exportAs={{
        filename: 'clients',
        title: 'Clients',
        build: rows => buildClientsExport(rows, orders, shipments)
      }}
    />
  )
}

export default ClientsTable
