'use client'

// Third-party Imports
import { useWatch, type Control } from 'react-hook-form'
import { CheckCircle2Icon, CircleIcon } from 'lucide-react'

// Type Imports
import type { CreateAdjustmentFormInput } from './create-adjustment-schema'
import type { StockAdjustmentReason } from '@/types/entities/stock-adjustment'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { computeAdjustmentTotals } from '@/lib/selectors/stock-adjustments-selectors'
import { ADJUSTMENT_REASON_LABEL, ADJUSTMENT_STATUS_BADGE } from '../adjustment-badges'

const ADJUSTMENT_RULES = [
  'Each line writes one signed ledger row',
  'Posting updates the global on-hand quantity',
  'An adjustment cannot drive stock negative',
  'Adjustment quantity of 0 is not allowed'
]

// Props
type AdjustmentSummarySidebarProps = {
  control: Control<CreateAdjustmentFormInput>
  warehouses: Warehouse[]
}

const AdjustmentSummarySidebar = ({ control, warehouses }: AdjustmentSummarySidebarProps) => {
  // Hooks
  const values = useWatch({ control })

  // Vars
  const lines = values.lines ?? []

  const normalizedLines = lines.map(line => ({
    id: line?.id ?? '',
    productId: line?.productId ?? '',
    name: line?.name ?? '',
    sku: line?.sku ?? '',
    primaryImage: line?.primaryImage ?? '',
    unit: line?.unit ?? 'units',
    currentQty: Number(line?.currentQty) || 0,
    adjustmentQty: Number(line?.adjustmentQty) || 0
  }))

  const totals = computeAdjustmentTotals({ lines: normalizedLines })

  const warehouse = warehouses.find(item => item.id === values.warehouseId)
  const reasonLabel = values.reason ? ADJUSTMENT_REASON_LABEL[values.reason as StockAdjustmentReason] : 'Not selected'
  const statusBadge = ADJUSTMENT_STATUS_BADGE.draft

  const checklist = [
    { label: 'Warehouse selected', done: Boolean(values.warehouseId) },
    { label: 'Reason selected', done: Boolean(values.reason) },
    { label: 'At least one product added', done: normalizedLines.length > 0 },
    {
      label: 'All adjustments are non-zero',
      done: normalizedLines.length > 0 && normalizedLines.every(line => line.adjustmentQty !== 0)
    },
    {
      label: 'No negative results',
      done: normalizedLines.length > 0 && normalizedLines.every(line => line.currentQty + line.adjustmentQty >= 0)
    },
    { label: 'Date set', done: Boolean(values.date) }
  ]

  return (
    <div className='grid h-fit grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1'>
      <Card className='gap-0 py-0'>
        <CardHeader className='flex flex-wrap items-center justify-between px-5 pt-5'>
          <CardTitle>Adjustment summary</CardTitle>
          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
        </CardHeader>
        <CardContent className='space-y-3 p-4 text-sm'>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Total line items</span>
            <span className='text-right font-medium tabular-nums'>{totals.lineCount}</span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Total added</span>
            <span className='text-success text-right font-medium tabular-nums'>+{totals.totalAdded}</span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Total removed</span>
            <span className='text-destructive text-right font-medium tabular-nums'>−{totals.totalRemoved}</span>
          </div>

          <Separator />

          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Net change</span>
            <span
              className={`text-right font-semibold tabular-nums ${
                totals.netChange < 0 ? 'text-destructive' : 'text-success'
              }`}
            >
              {totals.netChange > 0 ? '+' : ''}
              {totals.netChange}
            </span>
          </div>

          <Separator />

          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Warehouse</span>
            <span className='truncate text-right font-medium'>{warehouse?.name || 'Not selected'}</span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Reason</span>
            <span className='truncate text-right font-medium'>{reasonLabel}</span>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Readiness checklist</CardTitle>
        </CardHeader>
        <CardContent className='p-4 text-sm'>
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
        </CardContent>
      </Card>

      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Adjustment rules</CardTitle>
        </CardHeader>
        <CardContent className='p-4 text-sm'>
          <ul className='text-muted-foreground list-disc space-y-2 pl-4'>
            {ADJUSTMENT_RULES.map(rule => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdjustmentSummarySidebar
