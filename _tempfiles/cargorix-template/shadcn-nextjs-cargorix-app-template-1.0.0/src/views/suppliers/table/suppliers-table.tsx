'use client'

// React Imports
import { useMemo } from 'react'

// Component Imports
import getSupplierColumns from './columns'

// Shared Imports
import EntityTable from '@/components/shared/entity-table'

// Store Imports
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'
import { useSuppliersStore } from '@/store/use-suppliers-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { buildSuppliersExport } from '@/lib/selectors/supplier-selectors'

// Data Imports
import { SUPPLIER_STATUS_OPTIONS } from '../supplier-badges'

const SuppliersTable = () => {
  // Vars
  const suppliers = useSuppliersStore(state => state.suppliers)
  const purchaseOrders = usePurchaseOrdersStore(state => state.purchaseOrders)

  const data = useMemo(() => suppliers.filter(s => !s.isDraft), [suppliers])

  const columns = useMemo(() => getSupplierColumns(purchaseOrders), [purchaseOrders])

  const locationOptions = useMemo(
    () => [
      { label: 'All locations', value: 'all' },
      ...Array.from(new Set(data.map(s => s.state).filter(Boolean)))
        .sort()
        .map(state => ({ label: state as string, value: state as string }))
    ],
    [data]
  )

  const categoryOptions = useMemo(
    () => [
      { label: 'All categories', value: 'all' },
      ...Array.from(new Set(data.map(s => s.category).filter(Boolean)))
        .sort()
        .map(category => ({ label: category as string, value: category as string }))
    ],
    [data]
  )

  const filters = useMemo(
    () => [
      { columnId: 'status', label: 'Filter by status', placeholder: 'All statuses', options: SUPPLIER_STATUS_OPTIONS },
      { columnId: 'location', label: 'Filter by location', placeholder: 'All locations', options: locationOptions },
      {
        columnId: 'category',
        label: 'Filter by category',
        placeholder: 'All categories',
        width: 'w-55',
        options: categoryOptions
      }
    ],
    [locationOptions, categoryOptions]
  )

  // Hooks
  const table = useEntityTable({
    data,
    columns,
    getRowId: row => row.id,
    initialVisibility: { category: false }
  })

  return (
    <EntityTable
      table={table}
      columnCount={columns.length}
      noun='suppliers'
      emptyMessage='No suppliers found.'
      rowHref={row => `/suppliers/${row.id}`}
      rowLabel={row => `Open supplier ${row.id}`}
      search={{ columnId: 'supplier', label: 'Search suppliers' }}
      filters={filters}
      exportAs={{
        filename: 'suppliers',
        title: 'Suppliers',
        build: rows => buildSuppliersExport(rows, purchaseOrders)
      }}
    />
  )
}

export default SuppliersTable
