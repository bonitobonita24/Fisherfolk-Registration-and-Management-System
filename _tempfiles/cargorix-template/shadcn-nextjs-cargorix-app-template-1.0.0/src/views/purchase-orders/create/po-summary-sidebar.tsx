'use client'

// Third-party Imports
import { useWatch, type Control } from 'react-hook-form'
import { CheckCircle2Icon, CircleIcon } from 'lucide-react'

// Type Imports
import type { CreatePurchaseOrderFormInput } from './create-purchase-order-schema'
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { Supplier } from '@/types/entities/supplier'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { computePurchaseOrderTotals } from '@/lib/selectors/purchase-orders-selectors'
import type { LineMoneyInput } from '@/lib/selectors/purchase-orders-selectors'
import { PO_STATUS_BADGE } from '../po-badges'

const EM_DASH = '—'

// Props
type PoSummarySidebarProps = {
  control: Control<CreatePurchaseOrderFormInput>
  po?: PurchaseOrder
  suppliers: Supplier[]
  warehouses: Warehouse[]
  isDraft: boolean
}

const PoSummarySidebar = ({ control, po, suppliers, warehouses, isDraft }: PoSummarySidebarProps) => {
  // Hooks
  const values = useWatch({ control })

  // Vars
  const lines: LineMoneyInput[] = (values.lines ?? []).map(line => ({
    quantityOrdered: Number(line?.quantityOrdered) || 0,
    unitCost: Number(line?.unitCost) || 0,
    taxRatePercent: Number(line?.taxRatePercent) || 0,
    discountPercent: Number(line?.discountPercent) || 0
  }))

  const shippingCost = Number(values.shippingCost) || 0
  const totals = computePurchaseOrderTotals({ lines, shippingCost })

  const liveSupplier = suppliers.find(supplier => supplier.id === values.supplierId)

  const supplierInfo = isDraft
    ? liveSupplier
      ? {
          name: liveSupplier.name,
          contactPerson: liveSupplier.contactPerson,
          email: liveSupplier.email,
          phone: liveSupplier.phone
        }
      : undefined
    : po?.supplier

  const selectedWarehouse = warehouses.find(warehouse => warehouse.id === values.warehouseId)
  const deliveryAddress = isDraft ? selectedWarehouse?.address : po?.deliveryAddress

  const status = po?.status ?? 'draft'
  const statusBadge = PO_STATUS_BADGE[status]

  const checklist = [
    { label: 'Supplier selected', done: Boolean(values.supplierId) },
    { label: 'Warehouse set', done: Boolean(values.warehouseId) },
    { label: 'Line items added', done: lines.length > 0 }
  ]

  return (
    <div className='grid grid-cols-1 gap-6 md:max-lg:grid-cols-2'>
      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>PO summary</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 p-4 text-sm'>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Subtotal ({totals.itemCount} items)</span>
            <span className='text-right font-medium tabular-nums'>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Discount</span>
            <span className='text-right font-medium tabular-nums'>-${totals.discount.toFixed(2)}</span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Tax</span>
            <span className='text-right font-medium tabular-nums'>${totals.tax.toFixed(2)}</span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Shipping</span>
            <span className='text-right font-medium tabular-nums'>${totals.shipping.toFixed(2)}</span>
          </div>

          <Separator />

          <div className='flex items-baseline justify-between gap-4'>
            <span className='font-semibold'>Grand total</span>
            <span className='text-base font-semibold tabular-nums'>${totals.grandTotal.toFixed(2)}</span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Item count</span>
            <span className='text-right font-medium tabular-nums'>{totals.itemCount}</span>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Supplier info</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 p-4 text-sm'>
          {supplierInfo ? (
            <>
              <div className='flex items-baseline justify-between gap-4'>
                <span className='text-muted-foreground'>Name</span>
                <span className='truncate text-right font-medium'>{supplierInfo.name}</span>
              </div>
              <div className='flex items-baseline justify-between gap-4'>
                <span className='text-muted-foreground'>Contact</span>
                <span className='truncate text-right font-medium'>{supplierInfo.contactPerson || EM_DASH}</span>
              </div>
              <div className='flex items-baseline justify-between gap-4'>
                <span className='text-muted-foreground'>Email</span>
                <span className='truncate text-right font-medium'>{supplierInfo.email || EM_DASH}</span>
              </div>
              <div className='flex items-baseline justify-between gap-4'>
                <span className='text-muted-foreground'>Phone</span>
                <span className='truncate text-right font-medium'>{supplierInfo.phone || EM_DASH}</span>
              </div>
            </>
          ) : (
            <p className='text-muted-foreground'>Select a supplier to preview details.</p>
          )}

          <Separator />

          <div className='space-y-1'>
            <span className='text-muted-foreground'>Delivery address</span>
            <p className='font-medium whitespace-pre-line'>{deliveryAddress || EM_DASH}</p>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-0 py-0'>
        <CardHeader className='flex flex-wrap items-center justify-between px-5 pt-5'>
          <CardTitle>Status & workflow</CardTitle>
          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
        </CardHeader>
        <CardContent className='space-y-3 p-4 text-sm'>
          <ul className='space-y-2'>
            {checklist.map(item => (
              <li key={item.label} className='flex items-center gap-2'>
                {item.done ? (
                  <CheckCircle2Icon className='text-success size-4 shrink-0' />
                ) : (
                  <CircleIcon className='text-muted-foreground size-4 shrink-0' />
                )}
                <span className={item.done ? '' : 'text-muted-foreground'}>{item.label}</span>
              </li>
            ))}
          </ul>

          <Separator />

          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Receiving warehouse</span>
            <span className='truncate text-right font-medium'>{selectedWarehouse?.name || EM_DASH}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PoSummarySidebar
