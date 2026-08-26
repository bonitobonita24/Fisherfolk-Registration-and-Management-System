'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { CopyIcon, EyeIcon, MoreHorizontalIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { Order } from '@/types/entities/order'

// Component Imports
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'

type OrderRowActionsProps = {
  order: Order
}

const OrderRowActions = ({ order }: OrderRowActionsProps) => {
  // Hooks
  const router = useRouter()
  const duplicateOrder = useOrdersStore(state => state.duplicateOrder)

  const handleDuplicate = () => {
    const newId = duplicateOrder(order.id)

    if (newId) router.push(`/orders/create/${newId}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='ghost' size='icon' className='size-8' aria-label='Order actions' />}
      >
        <MoreHorizontalIcon className='size-4' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-fit'>
        <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)}>
          <EyeIcon data-icon='inline-start' />
          View order
        </DropdownMenuItem>
        {order.status === 'ready_for_shipment' && (
          <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}`)}>
            <TruckIcon data-icon='inline-start' />
            Create shipment
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDuplicate}>
          <CopyIcon data-icon='inline-start' />
          Duplicate order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default OrderRowActions
