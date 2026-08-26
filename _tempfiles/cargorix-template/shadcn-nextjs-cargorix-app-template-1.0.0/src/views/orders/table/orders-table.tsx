'use client'

// React Imports
import { useMemo } from 'react'

// Type Imports
import type { Client } from '@/types/entities/client'

// Component Imports
import getOrderColumns from './columns'

// Shared Imports
import EntityTable from '@/components/shared/entity-table'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { buildOrdersExport } from '@/lib/selectors/orders-selectors'

// Data Imports
import { ORDER_STATUS_OPTIONS } from '../order-badges'

const FILTERS = [
  {
    columnId: 'status',
    label: 'Filter by status',
    placeholder: 'All statuses',
    width: 'w-48',
    options: ORDER_STATUS_OPTIONS
  }
]

type OrdersTableProps = {
  clients: Client[]
}

const OrdersTable = ({ clients }: OrdersTableProps) => {
  // Vars
  const orders = useOrdersStore(state => state.orders)
  const shipments = useShipmentsStore(state => state.shipments)

  const columns = useMemo(() => getOrderColumns(clients, shipments), [clients, shipments])

  const liveRows = useMemo(() => orders.filter(o => !o.isDraft), [orders])

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
      noun='orders'
      emptyMessage='No orders found.'
      rowHref={row => `/orders/${row.id}`}
      rowLabel={row => `Open order ${row.displayId}`}
      search={{ columnId: 'order', label: 'Search orders' }}
      filters={FILTERS}
      exportAs={{
        filename: 'orders',
        title: 'Orders',
        build: rows => buildOrdersExport(rows, clients, shipments)
      }}
    />
  )
}

export default OrdersTable
