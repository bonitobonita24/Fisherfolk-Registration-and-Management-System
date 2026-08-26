'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import type { LucideIcon } from 'lucide-react'
import { ArrowRightIcon, PackageCheckIcon, PackageIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { FulfilmentStageKey } from '@/types/dashboards/operations-overview-types'
import { FULFILMENT_STAGE_LABELS } from '@/types/dashboards/operations-overview-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'

// Util Imports
import { getFulfilmentPipeline } from '@/lib/selectors/operations-selectors'
import { excludeDrafts } from '@/lib/exclude-drafts'

type FulfilmentPipelineCardProps = {
  className?: string
}

const STAGE_ICON: Record<FulfilmentStageKey, LucideIcon> = {
  packed: PackageIcon,
  shipped: TruckIcon,
  delivered: PackageCheckIcon
}

const FulfilmentPipelineCard = ({ className }: FulfilmentPipelineCardProps) => {
  // Hooks
  const orders = useOrdersStore(state => state.orders)
  const shipments = useShipmentsStore(state => state.shipments)

  // Vars
  const stages = getFulfilmentPipeline(orders, shipments)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg'>Fulfilment pipeline</CardTitle>
        <CardAction>
          <Button size='sm' variant='outline' render={<Link href='/orders' />} nativeButton={false}>
            Orders
            <ArrowRightIcon data-icon='inline-end' />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <Separator />
      </CardContent>

      <CardContent className='flex flex-1 flex-col gap-2'>
        <div className='flex items-baseline gap-1'>
          <span className='text-2xl font-medium'>{excludeDrafts(orders).length.toLocaleString()}</span>
          <span className='text-muted-foreground text-sm'>Orders across every stage</span>
        </div>

        <Tabs defaultValue='packed' className='flex-1 justify-between gap-6'>
          <TabsList className='w-full'>
            {stages.map(({ stage }) => {
              const Icon = STAGE_ICON[stage]

              return (
                <TabsTrigger key={stage} value={stage} className='flex items-center gap-1 px-1.5'>
                  <Icon />
                  <span className='max-sm:hidden'>{FULFILMENT_STAGE_LABELS[stage]}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {stages.map(({ stage, rows }) => (
            <TabsContent key={stage} value={stage} className='flex flex-col justify-evenly gap-6'>
              {rows.map(row => (
                <div key={row.label} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-base'>{row.label}</span>
                    <span className='text-muted-foreground text-sm'>{row.value}</span>
                  </div>
                  <Progress value={row.progress} />
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default FulfilmentPipelineCard
