'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { PlusIcon, UploadIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'

const OrdersPageHeader = () => {
  // Hooks
  const router = useRouter()
  const createDraftOrder = useOrdersStore(state => state.createDraftOrder)

  const handleCreateOrder = () => {
    const id = crypto.randomUUID()

    createDraftOrder(id)
    router.push(`/orders/create/${id}`)
  }

  return (
    <div className='flex flex-col gap-4 lg:flex-row lg:justify-between'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Orders</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Review incoming client requests and create shipments when an order is ready.
        </p>
      </div>
      <div className='flex flex-wrap gap-2'>
        <Button variant='secondary' className='gap-2'>
          <UploadIcon className='size-4' />
          Import orders
        </Button>
        <Button className='gap-2' onClick={handleCreateOrder}>
          <PlusIcon className='size-4' />
          Create order
        </Button>
      </div>
    </div>
  )
}

export default OrdersPageHeader
