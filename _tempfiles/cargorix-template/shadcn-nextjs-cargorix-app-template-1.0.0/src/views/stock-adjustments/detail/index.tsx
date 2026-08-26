'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Type Imports
import type { Product } from '@/types/entities/product'
import type { StockAdjustment } from '@/types/entities/stock-adjustment'
import type { StockMovement } from '@/types/entities/stock-movement'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import AdjustmentAttachmentsNotes from './adjustment-attachments-notes'
import AdjustmentDetailHeader from './adjustment-detail-header'
import AdjustmentInfoBar from './adjustment-info-bar'
import AdjustmentKpiCards from './adjustment-kpi-cards'
import AdjustmentLineItemsTable from './adjustment-line-items-table'
import AdjustmentRulesCard from './adjustment-rules-card'
import AdjustmentSummaryCard from './adjustment-summary-card'
import AdjustmentTimeline from './adjustment-timeline'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { useStockAdjustmentsStore } from '@/store/use-stock-adjustments-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type StockAdjustmentDetailViewProps = {
  adjustmentId: string
  adjustments: StockAdjustment[]
  movements: StockMovement[]
  products: Product[]
  warehouses: Warehouse[]
}

const StockAdjustmentDetailView = ({
  adjustmentId,
  adjustments,
  movements,
  products,
  warehouses
}: StockAdjustmentDetailViewProps) => {
  // Hooks
  const router = useRouter()
  const initializeAdjustments = useStockAdjustmentsStore(state => state.initialize)
  const initializeStockLedger = useStockLedgerStore(state => state.initialize)
  const initializeProducts = useProductsStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const a = useStockAdjustmentsStore(state => state.getAdjustment(adjustmentId))

  useEffect(() => {
    initializeAdjustments(adjustments)
  }, [initializeAdjustments, adjustments])

  useEffect(() => {
    initializeStockLedger(movements)
  }, [initializeStockLedger, movements])

  useEffect(() => {
    initializeProducts(products)
  }, [initializeProducts, products])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  if (!a) {
    return (
      <div className='py-24 text-center'>
        <h1 className='text-xl font-semibold'>Adjustment not found</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          This adjustment may have been created in a different browser session and isn&apos;t available after a reload.
        </p>
        <Button className='mt-4' onClick={() => router.push('/stock-adjustments')}>
          Back to adjustments
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <AdjustmentDetailHeader a={a} />
      <AdjustmentInfoBar a={a} />
      <AdjustmentKpiCards a={a} />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.85fr)]'>
        <div className='space-y-6'>
          <AdjustmentLineItemsTable a={a} />
          <AdjustmentTimeline a={a} />
        </div>
        <aside className='grid h-fit grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1'>
          <AdjustmentSummaryCard a={a} />
          <AdjustmentRulesCard a={a} />
          <AdjustmentAttachmentsNotes a={a} />
        </aside>
      </div>
    </div>
  )
}

export default StockAdjustmentDetailView
