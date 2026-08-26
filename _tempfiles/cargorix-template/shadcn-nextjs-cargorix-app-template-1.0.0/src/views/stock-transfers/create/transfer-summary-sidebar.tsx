'use client'

// Third-party Imports
import { useWatch, type Control } from 'react-hook-form'
import { CheckCircle2Icon, CircleIcon } from 'lucide-react'

// Type Imports
import type { CreateTransferFormInput } from './create-transfer-schema'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Util Imports
import { computeTransferTotals } from '@/lib/selectors/stock-transfers-selectors'
import { TRANSFER_STATUS_BADGE } from '../transfer-badges'

const TRANSFER_RULES = [
  'Stock must be available at the source warehouse',
  'Source and destination warehouses must differ',
  'Dispatching creates two linked ledger entries (out + in)',
  'Global stock quantity is unchanged by a transfer'
]

// Props
type TransferSummarySidebarProps = {
  control: Control<CreateTransferFormInput>
  warehouses: Warehouse[]
}

const TransferSummarySidebar = ({ control, warehouses }: TransferSummarySidebarProps) => {
  // Hooks
  const values = useWatch({ control })

  // Vars
  const lines = values.lines ?? []

  const totals = computeTransferTotals({
    lines: lines.map(line => ({
      id: line?.id ?? '',
      productId: line?.productId ?? '',
      name: line?.name ?? '',
      sku: line?.sku ?? '',
      primaryImage: line?.primaryImage ?? '',
      unit: line?.unit ?? 'units',
      quantitySent: Number(line?.quantitySent) || 0,
      quantityReceived: 0
    }))
  })

  const sourceWarehouse = warehouses.find(warehouse => warehouse.id === values.sourceWarehouseId)
  const destinationWarehouse = warehouses.find(warehouse => warehouse.id === values.destinationWarehouseId)
  const statusBadge = TRANSFER_STATUS_BADGE.draft

  const checklist = [
    { label: 'Source warehouse selected', done: Boolean(values.sourceWarehouseId) },
    { label: 'Destination warehouse selected', done: Boolean(values.destinationWarehouseId) },
    { label: 'At least one product added', done: lines.length > 0 },
    {
      label: 'All quantities greater than 0',
      done: lines.length > 0 && lines.every(line => Number(line?.quantitySent) > 0)
    },
    { label: 'Dispatch date set', done: Boolean(values.dispatchDate) },
    { label: 'Expected arrival set', done: Boolean(values.expectedArrival) }
  ]

  return (
    <div className='grid h-fit grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1'>
      <Card className='gap-0 py-0'>
        <CardHeader className='flex flex-wrap items-center justify-between px-5 pt-5'>
          <CardTitle>Transfer summary</CardTitle>
          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
        </CardHeader>
        <CardContent className='space-y-3 p-4 text-sm'>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Total line items</span>
            <span className='text-right font-medium tabular-nums'>{totals.totalLines}</span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Total units</span>
            <span className='text-right font-medium tabular-nums'>{totals.totalUnitsSent}</span>
          </div>

          <Separator />

          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Source warehouse</span>
            <span className='truncate text-right font-medium'>{sourceWarehouse?.name || 'Not selected'}</span>
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-muted-foreground'>Destination warehouse</span>
            <span className='truncate text-right font-medium'>{destinationWarehouse?.name || 'Not selected'}</span>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Transfer rules</CardTitle>
        </CardHeader>
        <CardContent className='p-4 text-sm'>
          <ul className='text-muted-foreground list-disc space-y-2 pl-4'>
            {TRANSFER_RULES.map(rule => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
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
    </div>
  )
}

export default TransferSummarySidebar
