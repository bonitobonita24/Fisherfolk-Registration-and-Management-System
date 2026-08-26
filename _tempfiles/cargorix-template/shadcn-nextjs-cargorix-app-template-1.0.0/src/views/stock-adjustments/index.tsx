'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { StockAdjustment } from '@/types/entities/stock-adjustment'
import type { StockMovement } from '@/types/entities/stock-movement'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import AdjustmentsHeader from './page-header'
import AdjustmentsKpiCards from './kpi-cards'
import AdjustmentsTable from './table/adjustments-table'

// Store Imports
import { useStockAdjustmentsStore } from '@/store/use-stock-adjustments-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type StockAdjustmentsViewProps = {
  adjustments: StockAdjustment[]
  movements: StockMovement[]
  warehouses: Warehouse[]
}

const StockAdjustmentsView = ({ adjustments, movements, warehouses }: StockAdjustmentsViewProps) => {
  // Hooks
  const initialize = useStockAdjustmentsStore(state => state.initialize)
  const initializeLedger = useStockLedgerStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)

  useEffect(() => {
    initialize(adjustments)
  }, [initialize, adjustments])

  useEffect(() => {
    initializeLedger(movements)
  }, [initializeLedger, movements])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  return (
    <div className='space-y-6'>
      <AdjustmentsHeader />
      <AdjustmentsKpiCards />
      <AdjustmentsTable />
    </div>
  )
}

export default StockAdjustmentsView
