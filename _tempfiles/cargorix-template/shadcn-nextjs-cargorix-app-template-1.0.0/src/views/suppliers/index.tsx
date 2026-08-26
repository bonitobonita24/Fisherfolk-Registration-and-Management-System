'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import SupplierKpiCards from './kpi-cards'
import SuppliersHeader from './page-header'
import SuppliersTable from './table/suppliers-table'

// Store Imports
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'
import { useSuppliersStore } from '@/store/use-suppliers-store'

type SuppliersViewProps = {
  suppliers: Supplier[]
  purchaseOrders: PurchaseOrder[]
}

const SuppliersView = ({ suppliers, purchaseOrders }: SuppliersViewProps) => {
  // Hooks
  const initializeSuppliers = useSuppliersStore(state => state.initialize)
  const initializePurchaseOrders = usePurchaseOrdersStore(state => state.initialize)

  useEffect(() => {
    initializeSuppliers(suppliers)
  }, [initializeSuppliers, suppliers])

  useEffect(() => {
    initializePurchaseOrders(purchaseOrders)
  }, [initializePurchaseOrders, purchaseOrders])

  return (
    <div className='space-y-6'>
      <SuppliersHeader />
      <SupplierKpiCards />
      <SuppliersTable />
    </div>
  )
}

export default SuppliersView
