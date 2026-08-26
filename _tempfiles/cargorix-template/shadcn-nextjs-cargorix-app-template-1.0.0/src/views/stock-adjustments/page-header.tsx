'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { InfoIcon, PlusIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

// Store Imports
import { useStockAdjustmentsStore } from '@/store/use-stock-adjustments-store'

const AdjustmentsHeader = () => {
  // Hooks
  const router = useRouter()

  const handleNewAdjustment = () => {
    const id = crypto.randomUUID()

    useStockAdjustmentsStore.getState().createDraftAdjustment(id)
    router.push(`/stock-adjustments/create/${id}`)
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between gap-4 max-sm:flex-col sm:items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Stock Adjustments</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Correct on-hand levels — cycle counts, damage, write-offs and found stock.
          </p>
        </div>
        <Button className='gap-2' onClick={handleNewAdjustment}>
          <PlusIcon className='size-4' />
          New adjustment
        </Button>
      </div>

      <div className='bg-sidebar flex gap-2.5 rounded-lg p-3'>
        <InfoIcon className='text-info mt-0.5 size-4 shrink-0' aria-hidden='true' />
        <p className='text-muted-foreground text-xs leading-relaxed'>
          Posting an adjustment writes one signed stock-ledger row per line and updates global on-hand. Adjustments
          cannot drive stock negative.
        </p>
      </div>
    </div>
  )
}

export default AdjustmentsHeader
