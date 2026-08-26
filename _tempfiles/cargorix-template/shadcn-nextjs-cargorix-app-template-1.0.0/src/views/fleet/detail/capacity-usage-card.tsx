// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// Util Imports
import { getCapacityKg } from '@/lib/selectors/fleet-selectors'

type CapacityUsageCardProps = {
  vehicle: Vehicle
}

const pct = (used: number, total: number) => (total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0)

const CapacityUsageCard = ({ vehicle }: CapacityUsageCardProps) => {
  // Vars
  const capacityKg = getCapacityKg(vehicle)
  const loadKg = vehicle.currentLoadKg ?? 0
  const loadPct = pct(loadKg, capacityKg)
  const volumePct = loadPct

  const stopsTotal = vehicle.stopsTotal
  const stopsRemaining = Math.max(0, stopsTotal - vehicle.stopsCompleted)
  const stopsPct = pct(vehicle.stopsCompleted, stopsTotal)

  const bars = [
    { label: 'Load', value: `${loadKg.toLocaleString()} / ${capacityKg.toLocaleString()} kg`, percent: loadPct },
    { label: 'Volume Usage', value: `${volumePct}%`, percent: volumePct },
    { label: 'Stops Remaining', value: `${stopsRemaining} of ${stopsTotal}`, percent: stopsPct }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity Usage</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {bars.map(bar => (
          <div key={bar.label} className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>{bar.label}</span>
              <span className='font-medium tabular-nums'>{bar.value}</span>
            </div>
            <Progress value={bar.percent} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default CapacityUsageCard
