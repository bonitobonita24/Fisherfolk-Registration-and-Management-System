'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ArrowLeftRightIcon, BellIcon, ChevronRightIcon, RefreshCwIcon, TruckIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Type Imports
import type { InventoryActivityKind } from '@/types/dashboards/inventory-overview-types'
import { INVENTORY_ACTIVITY_CONFIG } from '@/types/dashboards/inventory-overview-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { getRecentInventoryActivity } from '@/lib/selectors/inventory-selectors'
import { cn } from '@/lib/utils'

const ACTIVITY_ICON_MAP: Record<InventoryActivityKind, LucideIcon> = {
  receipt: TruckIcon,
  transfer: RefreshCwIcon,
  adjustment: ArrowLeftRightIcon,
  reorder: BellIcon
}

const RecentActivitySection = () => {
  const products = useProductsStore(state => state.products)
  const warehouses = useWarehousesStore(state => state.warehouses)
  const movements = useStockLedgerStore(state => state.movements)

  const activity = getRecentInventoryActivity(movements, products, warehouses)

  return (
    <Card className='gap-0! py-0'>
      <CardHeader className='flex items-center justify-between gap-2 border-b pt-5'>
        <CardTitle>Recent Inventory Activity</CardTitle>
        <CardAction>
          <Button size='sm' variant='outline' render={<Link href='/stock-ledger' />} nativeButton={false}>
            View all activity
            <ChevronRightIcon data-icon='inline-end' />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className='grid grid-cols-1 p-0 md:grid-cols-2 lg:grid-cols-4'>
        {activity.map((item, index) => {
          const Icon = ACTIVITY_ICON_MAP[item.kind]
          const config = INVENTORY_ACTIVITY_CONFIG[item.kind]

          return (
            <div
              key={item.id}
              className={cn(
                'flex flex-col gap-4 p-4',
                index < activity.length - 1 &&
                  'border-border border-b md:odd:border-r md:max-lg:nth-3:border-b-0 lg:border-r lg:border-b-0'
              )}
            >
              <div className='flex items-start gap-3'>
                <span
                  className={cn(
                    'grid size-11 shrink-0 place-items-center rounded-full [&>svg]:size-5',
                    config.iconClassName
                  )}
                >
                  <Icon />
                </span>
                <div className='min-w-0 flex-1'>
                  <Badge variant='outline'>{config.label}</Badge>
                  <p className='mt-1.5 truncate text-sm font-medium'>{item.title}</p>
                  <p className='text-muted-foreground mt-0.5 line-clamp-2 text-xs'>{item.description}</p>
                </div>
              </div>

              <div className='flex items-center justify-between gap-2 text-xs'>
                <span className='text-muted-foreground truncate'>{item.warehouse}</span>
                <span className='text-muted-foreground shrink-0'>{item.timeAgo}</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default RecentActivitySection
