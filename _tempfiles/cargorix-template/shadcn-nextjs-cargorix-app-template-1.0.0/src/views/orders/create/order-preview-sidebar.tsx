'use client'

// Third-party Imports
import { useWatch, type Control } from 'react-hook-form'
import { EyeIcon, InfoIcon } from 'lucide-react'

// Type Imports
import type { CreateOrderFormInput } from './create-order-schema'
import type { Client } from '@/types/entities/client'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import NextStepsList from './next-steps-list'

// Util Imports
import { computeOrderTotal } from '@/lib/selectors/orders-selectors'
import { toOrderPackages } from './order-package-mapper'

const EM_DASH = '—'

type OrderPreviewSidebarProps = {
  control: Control<CreateOrderFormInput>
  clients: Client[]
}

const OrderPreviewSidebar = ({ control, clients }: OrderPreviewSidebarProps) => {
  // Hooks
  const values = useWatch({ control })

  // Vars
  const client = clients.find(c => c.id === values.clientId)
  const packages = toOrderPackages(values.packages ?? [])
  const totalQty = packages.reduce((sum, p) => sum + p.quantity, 0)
  const totalWeightKg = packages.reduce((sum, p) => sum + p.weightKg, 0)
  const total = computeOrderTotal(values.serviceLevel ?? 'regular', packages)

  return (
    <Card className='gap-0 py-0'>
      <CardContent className='space-y-4 p-4'>
        <div className='flex items-center justify-between gap-2'>
          <h2 className='font-semibold'>Order preview</h2>
          <Badge variant='secondary'>
            <EyeIcon />
            Estimate
          </Badge>
        </div>

        <div className='space-y-3 text-sm'>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Client</span>
            <span className='truncate text-right font-medium'>{client?.name ?? EM_DASH}</span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Route</span>
            <span className='truncate text-right font-medium'>
              {values.pickupAddress || EM_DASH} → {values.deliveryAddress || EM_DASH}
            </span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Packages</span>
            <span className='text-right font-medium tabular-nums'>
              {totalQty} · {totalWeightKg.toLocaleString()} kg
            </span>
          </div>
        </div>

        <Separator />

        <div className='flex items-center justify-between gap-4'>
          <span className='text-muted-foreground flex items-center gap-1.5 text-sm'>
            Estimated charge
            <InfoIcon className='size-3.5' aria-hidden='true' />
          </span>
          <span className='text-success text-base font-semibold tabular-nums'>${total.toFixed(2)}</span>
        </div>

        <div className='bg-sidebar flex gap-2.5 rounded-lg p-3'>
          <InfoIcon className='text-info mt-0.5 size-4 shrink-0' aria-hidden='true' />
          <p className='text-muted-foreground text-xs leading-relaxed'>
            Estimates are based on selected service level and may change.
          </p>
        </div>
      </CardContent>

      <Separator />

      <CardContent className='p-4'>
        <NextStepsList />
      </CardContent>
    </Card>
  )
}

export default OrderPreviewSidebar
