// Type Imports
import type { WarehouseZone } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type ZoneBinLayoutProps = {
  zones: WarehouseZone[]
}

const LEGEND: { label: string; dotClassName: string }[] = [
  { label: 'Occupied', dotClassName: 'bg-foreground' },
  { label: 'Available', dotClassName: 'bg-muted-foreground/40' },
  { label: 'Empty', dotClassName: 'bg-muted' }
]

const ZoneBinLayout = ({ zones }: ZoneBinLayoutProps) => {
  return (
    <Card>
      <CardHeader className='flex flex-wrap items-center justify-between gap-4'>
        <CardTitle>Zone &amp; bin layout</CardTitle>
        <CardAction className='flex flex-wrap items-center gap-x-4 gap-y-1'>
          {LEGEND.map(item => (
            <span key={item.label} className='text-muted-foreground flex items-center gap-1.5 text-xs'>
              <span className={`size-2 rounded-full ${item.dotClassName}`} />
              {item.label}
            </span>
          ))}
        </CardAction>
      </CardHeader>
      <CardContent>
        {zones.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No zones configured yet.</p>
        ) : (
          <div className='grid gap-4 md:grid-cols-3'>
            {zones.map(zone => {
              const percent = zone.totalBins > 0 ? Math.round((zone.usedBins / zone.totalBins) * 100) : 0

              return (
                <div key={zone.id} className='rounded-lg border p-4'>
                  <p className='font-bold'>{zone.name}</p>
                  <p className='text-muted-foreground text-xs'>{zone.category}</p>
                  <p className='mt-3 text-sm'>
                    {zone.usedBins} / {zone.totalBins} bins
                  </p>
                  <div className='mt-2 flex items-center gap-2'>
                    <Progress value={percent} className='flex-1' />
                    <span className='text-muted-foreground w-9 text-right text-xs tabular-nums'>{percent}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ZoneBinLayout
