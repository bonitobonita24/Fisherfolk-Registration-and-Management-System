'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { InfoIcon, PlusIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

// Store Imports
import { useStockTransfersStore } from '@/store/use-stock-transfers-store'

const TransfersHeader = () => {
  // Hooks
  const router = useRouter()

  const handleNewTransfer = () => {
    const id = crypto.randomUUID()

    useStockTransfersStore.getState().createDraftTransfer(id)
    router.push(`/stock-transfers/create/${id}`)
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between gap-4 max-sm:flex-col sm:items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Stock Transfers</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Move stock between warehouses. Create, track, and manage transfers.
          </p>
        </div>
        <Button className='gap-2' onClick={handleNewTransfer}>
          <PlusIcon className='size-4' />
          New transfer
        </Button>
      </div>

      <div className='bg-sidebar flex gap-2.5 rounded-lg p-3'>
        <InfoIcon className='text-info mt-0.5 size-4 shrink-0' aria-hidden='true' />
        <p className='text-muted-foreground text-xs leading-relaxed'>
          Each transfer creates two stock-ledger rows — a{' '}
          <span className='text-foreground font-medium'>negative entry</span> for the source warehouse and a{' '}
          <span className='text-foreground font-medium'>positive entry</span> for the destination warehouse. Global
          stock remains unchanged.
        </p>
      </div>
    </div>
  )
}

export default TransfersHeader
