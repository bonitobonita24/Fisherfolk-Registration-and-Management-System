'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChevronRightIcon, CircleHelpIcon, WarehouseIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { getWarehouseStockSummaries } from '@/lib/selectors/inventory-selectors'

const WarehouseStockSection = () => {
  const products = useProductsStore(state => state.products)
  const warehouses = useWarehousesStore(state => state.warehouses)
  const movements = useStockLedgerStore(state => state.movements)

  const warehouseStock = getWarehouseStockSummaries(products, warehouses, movements)

  return (
    <Card className='h-full gap-0!'>
      <CardHeader className='border-b'>
        <div className='flex items-center gap-1.5'>
          <CardTitle>Stock by Warehouse</CardTitle>
          <Tooltip>
            <TooltipTrigger
              render={<span className='text-muted-foreground hover:text-foreground cursor-help' />}
              aria-label='About warehouse stock'
            >
              <CircleHelpIcon className='size-4' />
            </TooltipTrigger>
            <TooltipContent>Units currently stored against each location&apos;s maximum capacity.</TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>Capacity, utilization, and low-stock risks by location</CardDescription>
        <CardAction>
          <Button size='sm' variant='outline' render={<Link href='/warehouses' />} nativeButton={false}>
            Manage warehouses
            <ChevronRightIcon data-icon='inline-end' />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className='divide-border divide-y p-0'>
        {warehouseStock.map(warehouse => (
          <div key={warehouse.id} className='flex flex-wrap items-center gap-x-4 gap-y-3 p-4'>
            <div className='flex min-w-40 flex-1 items-center gap-3'>
              <span className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg'>
                <WarehouseIcon className='size-4' />
              </span>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium' title={warehouse.name}>
                  {warehouse.name}
                </p>
                <p className='text-muted-foreground mt-0.5 truncate text-xs'>
                  {warehouse.location} · {warehouse.skuCount} SKUs
                </p>
              </div>
            </div>

            <div className='flex shrink-0 gap-4'>
              <div>
                <p className='text-muted-foreground text-xs'>Capacity used</p>
                <p className='mt-1 text-sm font-semibold tabular-nums'>{warehouse.capacityUsedPercent}%</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Low stock</p>
                <p className='text-warning mt-1 text-sm font-semibold tabular-nums'>{warehouse.lowStockCount}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Out of stock</p>
                <p className='text-destructive mt-1 text-sm font-semibold tabular-nums'>{warehouse.outOfStockCount}</p>
              </div>
            </div>

            <div className='flex w-full items-center gap-3'>
              <Progress value={warehouse.capacityUsedPercent} className='flex-1' />
              <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                {warehouse.unitCount.toLocaleString()} / {warehouse.maxCapacity.toLocaleString()} units
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default WarehouseStockSection
