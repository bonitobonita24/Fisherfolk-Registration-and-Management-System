'use client'

// Next Imports
import dynamic from 'next/dynamic'

// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Skeleton } from '@/components/ui/skeleton'

// Util Imports
import { cn } from '@/lib/utils'

export interface FleetMapProps {
  vehicles: Vehicle[]
  selectedVehicleId?: string
  onSelectVehicle?: (id: string) => void
  className?: string
  height?: string | number
}

const FleetMapInner = dynamic(() => import('./fleet-map-inner'), {
  ssr: false,
  loading: () => <Skeleton className='size-full rounded-2xl' />
})

const LEGEND_ITEMS: { label: string; className: string }[] = [
  { label: 'On route', className: 'bg-info' },
  { label: 'Delayed', className: 'bg-warning' },
  { label: 'Completed', className: 'bg-success' },
  { label: 'Idle / Standby', className: 'bg-gray-600 dark:bg-gray-400' }
]

const FleetMap = ({ vehicles, selectedVehicleId, onSelectVehicle, className, height = 480 }: FleetMapProps) => {
  return (
    <div className={cn('relative', className)} style={{ height }}>
      <FleetMapInner
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={onSelectVehicle}
        height={height}
      />
      <div className='bg-background absolute bottom-4 left-4 z-500 space-y-2 rounded-lg border p-3 text-xs shadow'>
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} className='flex items-center gap-2'>
            <span className={cn('h-0.5 w-4 rounded-full', item.className)} />
            <span className='text-muted-foreground'>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FleetMap
