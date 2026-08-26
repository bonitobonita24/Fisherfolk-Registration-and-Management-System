'use client'

// React Imports
import { useMemo } from 'react'

// Component Imports
import getPurchaseOrderColumns from './columns'

// Shared Imports
import EntityTable from '@/components/shared/entity-table'

// Store Imports
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { buildPurchaseOrdersExport } from '@/lib/selectors/purchase-orders-selectors'

// Data Imports
import { PO_STATUS_OPTIONS } from '../po-badges'

const FILTERS = [
  {
    columnId: 'status',
    label: 'Filter by status',
    placeholder: 'All statuses',
    width: 'w-44',
    options: PO_STATUS_OPTIONS
  }
]

const PurchaseOrdersTable = () => {
  // Vars
  const purchaseOrders = usePurchaseOrdersStore(state => state.purchaseOrders)

  const columns = useMemo(() => getPurchaseOrderColumns(), [])

  const liveRows = useMemo(() => purchaseOrders.filter(po => !po.isDraft), [purchaseOrders])

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
      noun='results'
      emptyMessage='No purchase orders found.'
      rowHref={row => `/purchase-orders/${row.id}`}
      rowLabel={row => `Open purchase order ${row.number}`}
      search={{ columnId: 'number', label: 'Search purchase orders', placeholder: 'Search POs...' }}
      filters={FILTERS}
      exportAs={{ filename: 'purchase-orders', title: 'Purchase Orders', build: buildPurchaseOrdersExport }}
    />
  )
}

export default PurchaseOrdersTable
