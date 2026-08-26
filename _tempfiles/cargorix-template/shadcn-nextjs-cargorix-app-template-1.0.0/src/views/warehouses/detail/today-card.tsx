// Type Imports
import type { WarehouseTodaySnapshot } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type TodayCardProps = {
  today: WarehouseTodaySnapshot
}

const TodayCard = ({ today }: TodayCardProps) => {
  // Vars
  const rows: { label: string; value: string }[] = [
    { label: 'Inbound POs', value: `${today.inboundPOs}` },
    { label: 'Outbound shipments', value: `${today.outboundShipments}` },
    { label: 'Dock queue', value: `${today.dockQueueWaiting} waiting` }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {rows.map(row => (
            <div key={row.label} className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>{row.label}</span>
              <span className='font-semibold'>{row.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default TodayCard
