'use client'

// React Imports
import { useMemo } from 'react'

// Component Imports
import getStockTransferColumns from './columns'

// Shared Imports
import EntityTable from '@/components/shared/entity-table'

// Store Imports
import { useStockTransfersStore } from '@/store/use-stock-transfers-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { buildTransfersExport } from '@/lib/selectors/stock-transfers-selectors'

// Data Imports
import { db as warehousesDb } from '@/fake-db/entities/warehouses'
import { TRANSFER_STATUS_OPTIONS } from '../transfer-badges'

const WAREHOUSE_OPTIONS = [
  { label: 'All warehouses', value: 'all' },
  ...warehousesDb.map(warehouse => ({ label: warehouse.name, value: warehouse.id }))
]

const FILTERS = [
  {
    columnId: 'status',
    label: 'Filter by status',
    placeholder: 'All statuses',
    width: 'w-44',
    options: TRANSFER_STATUS_OPTIONS
  },
  {
    columnId: 'warehouse',
    label: 'Filter by warehouse',
    placeholder: 'All warehouses',
    width: 'w-44',
    options: WAREHOUSE_OPTIONS
  }
]

const TransfersTable = () => {
  // Vars
  const transfers = useStockTransfersStore(state => state.transfers)

  const columns = useMemo(() => getStockTransferColumns(), [])

  const liveRows = useMemo(() => transfers.filter(t => !t.isDraft), [transfers])

  // Hooks
  const table = useEntityTable({
    data: liveRows,
    columns,
    getRowId: row => row.id,
    initialVisibility: { warehouse: false }
  })

  return (
    <EntityTable
      table={table}
      columnCount={columns.length}
      noun='transfers'
      emptyMessage='No transfers found.'
      rowHref={row => `/stock-transfers/${row.id}`}
      rowLabel={row => `Open stock transfer ${row.number}`}
      search={{ columnId: 'number', label: 'Search transfers' }}
      filters={FILTERS}
      exportAs={{ filename: 'transfers', title: 'Stock Transfers', build: buildTransfersExport }}
    />
  )
}

export default TransfersTable
