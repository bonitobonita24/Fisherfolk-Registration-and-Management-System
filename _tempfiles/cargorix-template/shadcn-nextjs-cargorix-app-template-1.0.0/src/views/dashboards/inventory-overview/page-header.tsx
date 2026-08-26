'use client'

// Third-party Imports
import { CalendarIcon } from 'lucide-react'

// Type Imports
import type { InventoryDateRange } from '@/types/dashboards/inventory-overview-types'
import { INVENTORY_DATE_RANGE_LABELS, INVENTORY_DATE_RANGE_LIST } from '@/types/dashboards/inventory-overview-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Store Imports
import { useInventoryOverviewStore } from '@/store/use-inventory-overview-store'

const RANGE_SELECT_ITEMS = INVENTORY_DATE_RANGE_LIST.map(range => ({
  label: INVENTORY_DATE_RANGE_LABELS[range],
  value: range
}))

const InventoryOverviewHeader = () => {
  const selectedRange = useInventoryOverviewStore(state => state.selectedRange)
  const setRange = useInventoryOverviewStore(state => state.setRange)

  return (
    <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
      <div>
        <div className='flex flex-wrap items-center gap-3'>
          <h1 className='text-2xl font-semibold tracking-tight'>Inventory Overview</h1>
          <Badge variant='outline' className='text-success gap-1.5 rounded-full'>
            <span className='bg-success size-1.5 rounded-full' />
            Live inventory
          </Badge>
        </div>
        <p className='text-muted-foreground mt-1.5 text-sm'>
          Monitor stock health, reorder risks, and inventory turnover across all warehouses.
        </p>
      </div>

      <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
        <Select
          items={RANGE_SELECT_ITEMS}
          value={selectedRange}
          onValueChange={value => {
            if (value) setRange(value as InventoryDateRange)
          }}
        >
          <SelectTrigger className='w-full sm:w-48'>
            <CalendarIcon className='text-muted-foreground size-4 shrink-0' />
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
          >
            <SelectGroup>
              {INVENTORY_DATE_RANGE_LIST.map(range => (
                <SelectItem key={range} value={range}>
                  {INVENTORY_DATE_RANGE_LABELS[range]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default InventoryOverviewHeader
