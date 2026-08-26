'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Type Imports
import type { StockMovement } from '@/types/entities/stock-movement'
import type { StockTransfer } from '@/types/entities/stock-transfer'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import TransferAttachmentsNotes from './transfer-attachments-notes'
import TransferDetailHeader from './transfer-detail-header'
import TransferInfoBar from './transfer-info-bar'
import TransferKpiCards from './transfer-kpi-cards'
import TransferLineItemsTable from './transfer-line-items-table'
import TransferRulesCard from './transfer-rules-card'
import TransferSummaryCard from './transfer-summary-card'
import TransferTimeline from './transfer-timeline'
import TransferWorkflowCard from './transfer-workflow-card'

// Store Imports
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useStockTransfersStore } from '@/store/use-stock-transfers-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type StockTransferDetailViewProps = {
  transferId: string
  transfers: StockTransfer[]
  movements: StockMovement[]
  warehouses: Warehouse[]
}

const StockTransferDetailView = ({ transferId, transfers, movements, warehouses }: StockTransferDetailViewProps) => {
  // Hooks
  const router = useRouter()
  const initializeTransfers = useStockTransfersStore(state => state.initialize)
  const initializeStockLedger = useStockLedgerStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const t = useStockTransfersStore(state => state.getTransfer(transferId))

  useEffect(() => {
    initializeTransfers(transfers)
  }, [initializeTransfers, transfers])

  useEffect(() => {
    initializeStockLedger(movements)
  }, [initializeStockLedger, movements])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  if (!t) {
    return (
      <div className='py-24 text-center'>
        <h1 className='text-xl font-semibold'>Transfer not found</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          This transfer may have been created in a different browser session and isn&apos;t available after a reload.
        </p>
        <Button className='mt-4' onClick={() => router.push('/stock-transfers')}>
          Back to transfers
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <TransferDetailHeader t={t} />
      <TransferInfoBar t={t} />
      <TransferKpiCards t={t} />

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.85fr)]'>
        <div className='space-y-6'>
          <TransferLineItemsTable t={t} />
          <TransferTimeline t={t} />
        </div>
        <aside className='grid h-fit grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1'>
          <TransferSummaryCard t={t} />
          <div className='max-xl:order-1'>
            <TransferWorkflowCard t={t} />
          </div>
          <TransferRulesCard t={t} />
          <TransferAttachmentsNotes t={t} />
        </aside>
      </div>
    </div>
  )
}

export default StockTransferDetailView
