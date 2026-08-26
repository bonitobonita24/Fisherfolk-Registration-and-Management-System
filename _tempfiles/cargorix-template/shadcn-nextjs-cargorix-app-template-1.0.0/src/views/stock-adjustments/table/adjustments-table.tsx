'use client'

// React Imports
import { useMemo } from 'react'

// Component Imports
import getStockAdjustmentColumns from './columns'

// Shared Imports
import EntityTable from '@/components/shared/entity-table'

// Store Imports
import { useStockAdjustmentsStore } from '@/store/use-stock-adjustments-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { buildAdjustmentsExport } from '@/lib/selectors/stock-adjustments-selectors'

// Data Imports
import { db as warehousesDb } from '@/fake-db/entities/warehouses'
import { ADJUSTMENT_REASON_OPTIONS, ADJUSTMENT_STATUS_OPTIONS } from '../adjustment-badges'

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
    options: ADJUSTMENT_STATUS_OPTIONS
  },
  {
    columnId: 'warehouse',
    label: 'Filter by warehouse',
    placeholder: 'All warehouses',
    width: 'w-44',
    options: WAREHOUSE_OPTIONS
  },
  {
    columnId: 'reason',
    label: 'Filter by reason',
    placeholder: 'All reasons',
    width: 'w-44',
    options: ADJUSTMENT_REASON_OPTIONS
  }
]

const AdjustmentsTable = () => {
  // Vars
  const adjustments = useStockAdjustmentsStore(state => state.adjustments)

  const columns = useMemo(() => getStockAdjustmentColumns(), [])

  const liveRows = useMemo(() => adjustments.filter(a => !a.isDraft), [adjustments])

  // Hooks
  const table = useEntityTable({
    data: liveRows,
    columns,
    getRowId: row => row.id
  })

  return (
    <EntityTable
      table={table}
      columnCount={columns.length}
      noun='adjustments'
      emptyMessage='No adjustments found.'
      rowHref={row => `/stock-adjustments/${row.id}`}
      rowLabel={row => `Open stock adjustment ${row.number}`}
      search={{ columnId: 'number', label: 'Search adjustments' }}
      filters={FILTERS}
      exportAs={{ filename: 'adjustments', title: 'Stock Adjustments', build: buildAdjustmentsExport }}
    />
  )
}

export default AdjustmentsTable
