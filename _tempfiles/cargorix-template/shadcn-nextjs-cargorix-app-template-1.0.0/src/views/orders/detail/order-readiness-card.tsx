'use client'

// Third-party Imports
import { CircleCheckIcon } from 'lucide-react'

// Type Imports
import type { Order } from '@/types/entities/order'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type OrderReadinessCardProps = {
  order: Order
  onConfirm: () => void
  onReceive: () => void
}

const OrderReadinessCard = ({ order, onConfirm, onReceive }: OrderReadinessCardProps) => {
  const checks = [
    {
      label: 'Client and contacts verified',
      passed: Boolean(order.clientId && order.contactName && order.contactEmail && order.contactPhone)
    },
    { label: 'Pickup address validated', passed: Boolean(order.pickupAddress) },
    { label: 'Delivery address validated', passed: Boolean(order.deliveryAddress) },
    {
      label: 'Package weight and dimensions added',
      passed: order.packages.length > 0 && order.packages.every(p => p.weightKg > 0 && p.dimensions)
    },
    { label: 'Service and dates approved', passed: Boolean(order.requestedPickupAt && order.requiredDeliveryAt) },
    { label: 'Price approved', passed: order.totalAmount > 0 }
  ]

  const passedCount = checks.filter(c => c.passed).length
  const allPassed = passedCount === checks.length
  const canReceive = order.status === 'pending_review'
  const canConfirm = order.status === 'order_received' && allPassed

  return (
    <Card size='sm'>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='font-semibold'>Readiness check</h2>
          <span className={`text-xs font-semibold ${allPassed ? 'text-success' : 'text-muted-foreground'}`}>
            {passedCount}/{checks.length} complete
          </span>
        </div>
        <div className='bg-muted h-1.5 overflow-hidden rounded-full'>
          <div
            className='bg-success h-full rounded-full'
            style={{ width: `${(passedCount / checks.length) * 100}%` }}
          />
        </div>
        <div className='space-y-2.5 text-sm'>
          {checks.map(check => (
            <p key={check.label} className='flex items-start gap-2'>
              <CircleCheckIcon
                className={`mt-0.5 size-4 shrink-0 ${check.passed ? 'text-success' : 'text-muted-foreground/50'}`}
              />
              <span className={check.passed ? '' : 'text-muted-foreground'}>{check.label}</span>
            </p>
          ))}
        </div>
        {canReceive && (
          <Button className='w-full' onClick={onReceive}>
            Mark as received
          </Button>
        )}
        {canConfirm && (
          <Button className='w-full' onClick={onConfirm}>
            Confirm order
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default OrderReadinessCard
