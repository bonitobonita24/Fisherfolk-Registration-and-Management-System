'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Type Imports
import type { Product } from '@/types/entities/product'
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { StockMovement } from '@/types/entities/stock-movement'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import PoActivityTimeline from './po-activity-timeline'
import PoAttachmentsNotes from './po-attachments-notes'
import PoDetailHeader from './po-detail-header'
import PoInfoBar from './po-info-bar'
import PoKpiCards from './po-kpi-cards'
import PoLineItemsTable from './po-line-items-table'
import PoReceiptsHistory from './po-receipts-history'
import PoReceivingSummaryCard from './po-receiving-summary-card'
import PoSummaryCard from './po-summary-card'
import PoSupplierInfoCard from './po-supplier-info-card'
import ReceiveItemsDialog from './receive-items-dialog'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type PurchaseOrderDetailViewProps = {
  poId: string
  purchaseOrders: PurchaseOrder[]
  products: Product[]
  movements: StockMovement[]
  warehouses: Warehouse[]
}

const PurchaseOrderDetailView = ({
  poId,
  purchaseOrders,
  products,
  movements,
  warehouses
}: PurchaseOrderDetailViewProps) => {
  // States
  const [receiveOpen, setReceiveOpen] = useState(false)

  // Hooks
  const router = useRouter()
  const initializePurchaseOrders = usePurchaseOrdersStore(state => state.initialize)
  const initializeProducts = useProductsStore(state => state.initialize)
  const initializeStockLedger = useStockLedgerStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const storePo = usePurchaseOrdersStore(state => state.getPurchaseOrder(poId))

  useEffect(() => {
    initializePurchaseOrders(purchaseOrders)
  }, [initializePurchaseOrders, purchaseOrders])

  useEffect(() => {
    initializeProducts(products)
  }, [initializeProducts, products])

  useEffect(() => {
    initializeStockLedger(movements)
  }, [initializeStockLedger, movements])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  const po = storePo ?? purchaseOrders.find(p => p.id === poId)

  if (!po) {
    return (
      <div className='py-24 text-center'>
        <h1 className='text-xl font-semibold'>Purchase order not found</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          This purchase order may have been created in a different browser session and isn&apos;t available after a
          reload.
        </p>
        <Button className='mt-4' onClick={() => router.push('/purchase-orders')}>
          Back to purchase orders
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <PoDetailHeader po={po} onReceive={() => setReceiveOpen(true)} />
      <PoInfoBar po={po} />
      <PoKpiCards po={po} />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.85fr)]'>
        <div className='grid h-fit grid-cols-1 gap-6 md:max-xl:grid-cols-2'>
          <div className='md:max-xl:col-span-2'>
            <PoLineItemsTable po={po} />
          </div>
          <PoReceiptsHistory po={po} />
          <PoAttachmentsNotes po={po} />
        </div>
        <aside className='grid h-fit grid-cols-1 gap-6 md:max-xl:grid-cols-2'>
          <PoSummaryCard po={po} />
          <PoSupplierInfoCard po={po} />

          <PoReceivingSummaryCard po={po} />

          <PoActivityTimeline po={po} />
        </aside>
      </div>

      <ReceiveItemsDialog po={po} open={receiveOpen} onOpenChange={setReceiveOpen} />
    </div>
  )
}

export default PurchaseOrderDetailView
