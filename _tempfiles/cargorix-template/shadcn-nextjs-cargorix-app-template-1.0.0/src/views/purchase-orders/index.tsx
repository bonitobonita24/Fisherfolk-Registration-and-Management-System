'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'

// Component Imports
import PurchaseOrdersPageHeader from './page-header'
import PurchaseOrdersKpiCards from './kpi-cards'
import PurchaseOrdersTable from './table/purchase-orders-table'

// Store Imports
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'

type PurchaseOrdersViewProps = {
  purchaseOrders: PurchaseOrder[]
}

const PurchaseOrdersView = ({ purchaseOrders }: PurchaseOrdersViewProps) => {
  // Hooks
  const initialize = usePurchaseOrdersStore(state => state.initialize)

  useEffect(() => {
    initialize(purchaseOrders)
  }, [initialize, purchaseOrders])

  return (
    <div className='space-y-6'>
      <PurchaseOrdersPageHeader />
      <PurchaseOrdersKpiCards />
      <PurchaseOrdersTable />
    </div>
  )
}

export default PurchaseOrdersView
