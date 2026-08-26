'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { StockMovement } from '@/types/entities/stock-movement'

// Component Imports
import StockLedgerPageHeader from './page-header'
import LedgerTable from './table/ledger-table'

// Store Imports
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'

type StockLedgerViewProps = {
  movements: StockMovement[]
}

const StockLedgerView = ({ movements }: StockLedgerViewProps) => {
  const initialize = useStockLedgerStore(state => state.initialize)

  useEffect(() => {
    initialize(movements)
  }, [initialize, movements])

  return (
    <div className='space-y-6'>
      <StockLedgerPageHeader />
      <LedgerTable />
    </div>
  )
}

export default StockLedgerView
