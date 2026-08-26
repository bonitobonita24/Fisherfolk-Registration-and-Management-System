'use client'

// React Imports
import { useMemo } from 'react'

// Component Imports
import getLedgerColumns from './columns'
import LedgerStats from '../ledger-stats'

// Shared Imports
import EntityTable from '@/components/shared/entity-table'

// Store Imports
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { buildLedgerExport, computeLedgerRows, ledgerNow } from '@/lib/selectors/stock-ledger-selectors'

// Data Imports
import { DATE_RANGE_OPTIONS, MOVEMENT_TYPE_OPTIONS } from '../ledger-badges'

const LedgerTable = () => {
  // Hooks
  const movements = useStockLedgerStore(state => state.movements)

  // Vars
  const rows = useMemo(() => computeLedgerRows(movements), [movements])
  const now = useMemo(() => ledgerNow(movements), [movements])

  const columns = useMemo(() => getLedgerColumns(now), [now])

  const warehouseOptions = useMemo(() => {
    const seen = new Map<string, string>()

    for (const m of movements) if (!seen.has(m.warehouseId)) seen.set(m.warehouseId, m.warehouseName)

    return [
      { label: 'All warehouses', value: 'all' },
      ...[...seen.entries()].map(([value, label]) => ({ label, value }))
    ]
  }, [movements])

  const filters = useMemo(
    () => [
      {
        columnId: 'type',
        label: 'Filter by type',
        placeholder: 'All types',
        width: 'w-36',
        options: MOVEMENT_TYPE_OPTIONS
      },
      {
        columnId: 'warehouse',
        label: 'Filter by warehouse',
        placeholder: 'All warehouses',
        options: warehouseOptions
      },
      { columnId: 'date', label: 'Filter by date range', placeholder: 'All time', options: DATE_RANGE_OPTIONS }
    ],
    [warehouseOptions]
  )

  const table = useEntityTable({
    data: rows,
    columns,
    getRowId: row => row.id,
    initialSorting: [{ id: 'date', desc: true }]
  })

  const filteredRows = table.getFilteredRowModel().rows.map(row => row.original)

  return (
    <div className='space-y-4'>
      <LedgerStats rows={filteredRows} />
      <EntityTable
        table={table}
        columnCount={columns.length}
        noun='movements'
        emptyMessage='No movements found.'
        rowHref={row => `/products/${row.productId}`}
        rowLabel={row => `Open product ${row.name}`}
        search={{ columnId: 'product', label: 'Search movements' }}
        filters={filters}
        exportAs={{ filename: 'stock-ledger', title: 'Stock Ledger', build: buildLedgerExport }}
      />
    </div>
  )
}

export default LedgerTable
