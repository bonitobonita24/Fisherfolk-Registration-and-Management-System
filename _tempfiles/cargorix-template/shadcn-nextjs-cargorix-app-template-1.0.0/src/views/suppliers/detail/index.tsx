'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { notFound } from 'next/navigation'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import AddressesCard from './addresses-card'
import DocumentsCard from './documents-card'
import NotesCard from './notes-card'
import PrimaryContactCard from './primary-contact-card'
import ProcurementTermsCard from './procurement-terms-card'
import RecentActivityCard from './recent-activity-card'
import RecentPurchaseOrdersCard from './recent-purchase-orders-card'
import SuppliedProductsCard from './supplied-products-card'
import SupplierDetailHeader from './supplier-detail-header'
import SupplierInfoCard from './supplier-info-card'

// Store Imports
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'
import { useSuppliersStore } from '@/store/use-suppliers-store'

type SupplierDetailViewProps = {
  supplierId: string
  suppliers: Supplier[]
  purchaseOrders: PurchaseOrder[]
}

const SupplierDetailView = ({ supplierId, suppliers, purchaseOrders }: SupplierDetailViewProps) => {
  // Hooks
  const initializeSuppliers = useSuppliersStore(state => state.initialize)
  const initializePurchaseOrders = usePurchaseOrdersStore(state => state.initialize)
  const storedSupplier = useSuppliersStore(state => state.suppliers.find(s => s.id === supplierId && !s.isDraft))
  const storedPurchaseOrders = usePurchaseOrdersStore(state => state.purchaseOrders)

  const supplier = storedSupplier ?? suppliers.find(s => s.id === supplierId && !s.isDraft)
  const poList = storedPurchaseOrders.length > 0 ? storedPurchaseOrders : purchaseOrders

  useEffect(() => {
    initializeSuppliers(suppliers)
  }, [initializeSuppliers, suppliers])

  useEffect(() => {
    initializePurchaseOrders(purchaseOrders)
  }, [initializePurchaseOrders, purchaseOrders])

  if (!supplier) notFound()

  return (
    <div className='relative grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
      <div className='min-w-0 space-y-6'>
        <SupplierDetailHeader supplier={supplier} purchaseOrders={poList} />
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
          <SupplierInfoCard supplier={supplier} />
          <PrimaryContactCard supplier={supplier} />
          <ProcurementTermsCard supplier={supplier} />
        </div>
        <RecentPurchaseOrdersCard supplier={supplier} purchaseOrders={poList} />
        <div className='grid grid-cols-1 gap-6 lg:max-xl:grid-cols-2'>
          <SuppliedProductsCard supplier={supplier} />
          <RecentActivityCard supplier={supplier} />
        </div>
      </div>
      <aside className='grid grid-cols-1 gap-6 self-start sm:max-xl:grid-cols-2 xl:sticky xl:top-18'>
        <AddressesCard supplier={supplier} />
        <NotesCard supplier={supplier} />
        <DocumentsCard supplier={supplier} />
      </aside>
    </div>
  )
}

export default SupplierDetailView
