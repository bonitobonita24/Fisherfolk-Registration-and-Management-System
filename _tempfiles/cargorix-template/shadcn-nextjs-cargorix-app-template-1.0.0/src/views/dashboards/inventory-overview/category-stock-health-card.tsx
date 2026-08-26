'use client'

// Third-party Imports
import {
  BookOpenIcon,
  CircleHelpIcon,
  DumbbellIcon,
  LaptopIcon,
  PackageIcon,
  ShirtIcon,
  SproutIcon
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Type Imports
import type { CategoryIconName } from '@/types/dashboards/inventory-overview-types'
import { CATEGORY_STATUS_CONFIG } from '@/types/dashboards/inventory-overview-types'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'

// Util Imports
import { getCategoryHealth } from '@/lib/selectors/inventory-selectors'
import { cn } from '@/lib/utils'

const CATEGORY_ICON_MAP: Record<CategoryIconName, LucideIcon> = {
  laptop: LaptopIcon,
  shirt: ShirtIcon,
  dumbbell: DumbbellIcon,
  sprout: SproutIcon,
  'book-open': BookOpenIcon,
  package: PackageIcon
}

const CategoryStockHealthCard = () => {
  const products = useProductsStore(state => state.products)

  const categoryHealth = getCategoryHealth(products)

  return (
    <Card className='h-full gap-0!'>
      <CardHeader className='border-b'>
        <div className='flex items-center gap-1.5'>
          <CardTitle>Stock Health by Category</CardTitle>
          <Tooltip>
            <TooltipTrigger
              render={<span className='text-muted-foreground hover:text-foreground cursor-help' />}
              aria-label='About stock health'
            >
              <CircleHelpIcon className='size-4' />
            </TooltipTrigger>
            <TooltipContent>Share of each category&apos;s SKUs that sit above their reorder point.</TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>Available stock against recommended inventory levels</CardDescription>
      </CardHeader>

      <CardContent className='divide-border divide-y p-0'>
        {categoryHealth.map(category => {
          const Icon = CATEGORY_ICON_MAP[category.icon]
          const statusConfig = CATEGORY_STATUS_CONFIG[category.status]

          return (
            <div key={category.id} className='flex items-center gap-4 px-5 py-3.5'>
              <span className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg'>
                <Icon className='size-4' />
              </span>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>{category.name}</p>
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  {category.skuCount} SKUs · {category.value} value
                </p>
              </div>
              <Progress value={category.utilizationPercent} className='hidden w-24 shrink-0 sm:block lg:w-32' />
              <span className='w-10 shrink-0 text-right text-sm font-semibold tabular-nums'>
                {category.utilizationPercent}%
              </span>
              <Badge
                variant='outline'
                className={cn('w-18 shrink-0 justify-center border-0', statusConfig.textClassName)}
              >
                {statusConfig.label}
              </Badge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default CategoryStockHealthCard
