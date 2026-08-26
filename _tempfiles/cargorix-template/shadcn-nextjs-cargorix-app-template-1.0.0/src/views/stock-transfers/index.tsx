'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { StockMovement } from '@/types/entities/stock-movement'
import type { StockTransfer } from '@/types/entities/stock-transfer'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import TransfersHeader from './page-header'
import TransfersKpiCards from './kpi-cards'
import TransfersOverviewSidebar from './overview-sidebar'
import TransfersTable from './table/transfers-table'

// Store Imports
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useStockTransfersStore } from '@/store/use-stock-transfers-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type StockTransfersViewProps = {
  transfers: StockTransfer[]
  movements: StockMovement[]
  warehouses: Warehouse[]
}

const StockTransfersView = ({ transfers, movements, warehouses }: StockTransfersViewProps) => {
  // Hooks
  const initialize = useStockTransfersStore(state => state.initialize)
  const initializeLedger = useStockLedgerStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)

  useEffect(() => {
    initialize(transfers)
  }, [initialize, transfers])

  useEffect(() => {
    initializeLedger(movements)
  }, [initializeLedger, movements])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  return (
    <div className='space-y-6'>
      <TransfersHeader />
      <TransfersKpiCards />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <div>
          <TransfersTable />
        </div>
        <TransfersOverviewSidebar />
      </div>
    </div>
  )
}

export default StockTransfersView
