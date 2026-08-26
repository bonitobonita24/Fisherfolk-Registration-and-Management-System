'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { InfoIcon, PlusIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

// Store Imports
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'

const PurchaseOrdersPageHeader = () => {
  // Hooks
  const router = useRouter()

  const handleNewPurchaseOrder = () => {
    const id = crypto.randomUUID()

    usePurchaseOrdersStore.getState().createDraftPurchaseOrder(id)
    router.push(`/purchase-orders/create/${id}`)
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between gap-4 max-sm:flex-col sm:items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Purchase Orders</h1>
          <p className='text-muted-foreground mt-1 text-sm'>Restock inbound inventory from suppliers</p>
        </div>
        <Button className='gap-2' onClick={handleNewPurchaseOrder}>
          <PlusIcon className='size-4' />
          New PO
        </Button>
      </div>

      <div className='bg-sidebar flex gap-2.5 rounded-lg p-3'>
        <InfoIcon className='text-info mt-0.5 size-4 shrink-0' aria-hidden='true' />
        <p className='text-muted-foreground text-xs leading-relaxed'>
          A received purchase order writes a <span className='text-foreground font-medium'>Receipt</span> ledger entry —
          this is how inbound stock enters the system.
        </p>
      </div>
    </div>
  )
}

export default PurchaseOrdersPageHeader
