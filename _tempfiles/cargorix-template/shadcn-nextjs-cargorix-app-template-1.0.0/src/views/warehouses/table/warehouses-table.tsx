'use client'

// React Imports
import { useMemo } from 'react'

// Component Imports
import getWarehouseColumns from './columns'

// Shared Imports
import EntityTable from '@/components/shared/entity-table'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useStockTransfersStore } from '@/store/use-stock-transfers-store'
import { useUsersStore } from '@/store/use-users-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import {
  buildWarehouseInventoryMap,
  buildWarehouseOverviewRows,
  buildWarehousesExport
} from '@/lib/selectors/warehouse-selectors'

// Data Imports
import {
  UTILIZATION_FILTER_OPTIONS,
  WAREHOUSE_STATUS_FILTER_OPTIONS,
  buildLocationFilterOptions
} from '../warehouse-badges'

const WarehousesTable = () => {
  // Vars
  const warehouses = useWarehousesStore(state => state.warehouses)
  const products = useProductsStore(state => state.products)
  const movements = useStockLedgerStore(state => state.movements)
  const transfers = useStockTransfersStore(state => state.transfers)
  const users = useUsersStore(state => state.users)

  const columns = useMemo(() => getWarehouseColumns(), [])

  const inventoryMap = useMemo(
    () => buildWarehouseInventoryMap(movements, transfers, products),
    [movements, transfers, products]
  )

  const data = useMemo(
    () => buildWarehouseOverviewRows(warehouses, inventoryMap, users),
    [warehouses, inventoryMap, users]
  )

  const filters = useMemo(
    () => [
      {
        columnId: 'status',
        label: 'Filter by status',
        placeholder: 'All status',
        options: WAREHOUSE_STATUS_FILTER_OPTIONS
      },
      {
        columnId: 'location',
        label: 'Filter by location',
        placeholder: 'All locations',
        options: buildLocationFilterOptions(warehouses)
      },
      {
        columnId: 'utilization',
        label: 'Filter by utilization',
        placeholder: 'All utilization',
        options: UTILIZATION_FILTER_OPTIONS
      }
    ],
    [warehouses]
  )

  // Hooks
  const table = useEntityTable({
    data,
    columns,
    getRowId: row => row.id,
    enableRowSelection: true
  })

  return (
    <EntityTable
      table={table}
      columnCount={columns.length}
      noun='warehouses'
      emptyMessage='No warehouses found.'
      rowHref={row => `/warehouses/${row.id}`}
      rowLabel={row => `Open warehouse ${row.name}`}
      interactiveColumnIds={['actions', 'select']}
      search={{ columnId: 'warehouse', label: 'Search warehouses' }}
      filters={filters}
      exportAs={{ filename: 'warehouses', title: 'Warehouses', build: buildWarehousesExport }}
    />
  )
}

export default WarehousesTable
