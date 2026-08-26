'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { ChevronRightIcon, SparklesIcon } from 'lucide-react'

// Type Imports
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type NextStep = {
  description: string
  actionLabel?: string
  onAction?: () => void
}

type OrderNextStepCardProps = {
  order: Order
  shipment?: Shipment
  onConfirm: () => void
  onReceive: () => void
  onCreateShipment: () => void
  onDuplicate: () => void
}

const OrderNextStepCard = ({
  order,
  shipment,
  onConfirm,
  onReceive,
  onCreateShipment,
  onDuplicate
}: OrderNextStepCardProps) => {
  // Hooks
  const router = useRouter()

  const getNextStep = (): NextStep => {
    switch (order.status) {
      case 'draft':
        return {
          description: 'Finish the draft, add the missing details, and submit the order for review.',
          actionLabel: 'Continue draft',
          onAction: () => router.push(`/orders/create/${order.id}`)
        }
      case 'pending_review':
        return {
          description: 'Acknowledge the request to move it into the intake queue.',
          actionLabel: 'Mark as received',
          onAction: onReceive
        }
      case 'order_received':
        return {
          description: 'Clear the readiness checks and confirm the order so a shipment can be created from it.',
          actionLabel: 'Confirm order',
          onAction: onConfirm
        }
      case 'ready_for_shipment':
        return {
          description:
            'Create a shipment to select packages, schedule pickup, assign a driver and vehicle, and generate tracking.',
          actionLabel: 'Create shipment',
          onAction: onCreateShipment
        }
      case 'in_fulfilment':
        return {
          description: 'Track progress on the linked shipment until delivery is confirmed.',
          actionLabel: shipment ? 'View shipment' : undefined,
          onAction: shipment ? () => router.push(`/shipments/${shipment.id}`) : undefined
        }
      case 'on_hold':
        return {
          description: 'Clear the hold before planning continues — nothing can be dispatched while the order is held.'
        }
      case 'completed':
        return {
          description: 'This order is delivered and closed. Duplicate it to repeat the same request.',
          actionLabel: 'Duplicate order',
          onAction: onDuplicate
        }
      case 'cancelled':
        return {
          description: 'This order is closed. Duplicate it to start a new request with the same details.',
          actionLabel: 'Duplicate order',
          onAction: onDuplicate
        }
    }
  }

  const nextStep = getNextStep()

  return (
    <Card size='sm'>
      <CardContent className='space-y-3'>
        <div className='flex items-center gap-2'>
          <SparklesIcon className='text-primary size-4' />
          <h2 className='font-semibold'>What&apos;s next?</h2>
        </div>
        <p className='text-muted-foreground text-sm'>{nextStep.description}</p>
        {nextStep.actionLabel && (
          <Button variant='outline' className='w-full justify-between' onClick={nextStep.onAction}>
            {nextStep.actionLabel}
            <ChevronRightIcon data-icon='inline-end' />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default OrderNextStepCard
