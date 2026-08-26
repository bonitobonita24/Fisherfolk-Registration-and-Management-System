// Type Imports
import type { Warehouse, WarehouseCapacityStatus, WarehouseInventory } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// Util Imports
import {
  getWarehouseCapacityStatus,
  getWarehouseFreeSpace,
  getWarehouseUtilization
} from '@/lib/selectors/warehouse-selectors'
import { cn } from '@/lib/utils'

type CapacityCardProps = {
  warehouse: Warehouse
  inventory: WarehouseInventory
}

const STATUS_STYLE: Record<WarehouseCapacityStatus, { bar: string; text: string; note?: string }> = {
  ok: { bar: 'progress-primary', text: 'text-muted-foreground' },
  high: { bar: 'progress-warning', text: 'text-warning', note: 'Nearly full — inbound stock may be rejected.' },
  full: { bar: 'progress-warning', text: 'text-warning', note: 'Full — no room for inbound stock.' },
  over: {
    bar: 'progress-destructive',
    text: 'text-destructive',
    note: 'Over capacity — raise the limit or move stock out.'
  }
}

const CapacityCard = ({ warehouse, inventory }: CapacityCardProps) => {
  // Vars
  const utilization = getWarehouseUtilization(inventory.unitsStored, warehouse.maxCapacity)
  const freeSpace = getWarehouseFreeSpace(inventory.unitsStored, warehouse.maxCapacity)
  const style = STATUS_STYLE[getWarehouseCapacityStatus(utilization)]

  const rows: { label: string; value: string }[] = [
    { label: 'Free space', value: `${freeSpace.toLocaleString()} units` },
    { label: 'Reserved for transfer', value: `${inventory.reserved.toLocaleString()} units` },
    { label: 'Unreserved stock', value: `${inventory.available.toLocaleString()} units` }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <p className='text-2xl font-bold'>
          {inventory.unitsStored.toLocaleString()}{' '}
          <span className='text-muted-foreground text-base font-normal'>
            / {warehouse.maxCapacity.toLocaleString()} units
          </span>
        </p>
        <div className='flex items-center gap-2'>
          <Progress value={Math.min(100, utilization)} className={cn('flex-1', style.bar)} />
          <span className={cn('w-9 text-right text-xs tabular-nums', style.text)}>{utilization}%</span>
        </div>
        {style.note && <p className={cn('text-xs', style.text)}>{style.note}</p>}
        <div className='space-y-3'>
          {rows.map(row => (
            <div key={row.label} className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>{row.label}</span>
              <span className='font-medium'>{row.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default CapacityCard
