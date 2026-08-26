// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { Driver } from '@/types/entities/driver'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Data Imports
import { DRIVER_TYPE_LABEL } from '../driver-badges'

type AvailabilityShiftCardProps = {
  driver: Driver
}

const formatDate = (value?: string) => (value ? format(new Date(value), 'dd MMM yyyy') : '—')

const AvailabilityShiftCard = ({ driver }: AvailabilityShiftCardProps) => {
  // Vars
  const rows: { label: string; value: string }[] = [
    { label: 'Current Shift', value: driver.shiftHours || '—' },
    { label: 'Weekly Off', value: driver.weeklyOff || '—' },
    { label: 'Shift Type', value: driver.driverType ? DRIVER_TYPE_LABEL[driver.driverType] : 'Standard' },
    { label: 'Next Off', value: formatDate(driver.nextOff) }
  ]

  return (
    <Card className='max-lg:order-1'>
      <CardHeader>
        <CardTitle>Availability &amp; Shift</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className='space-y-3 text-sm'>
          {rows.map(row => (
            <div key={row.label} className='flex items-center justify-between gap-4'>
              <dt className='text-muted-foreground'>{row.label}</dt>
              <dd className='text-right font-medium'>{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

export default AvailabilityShiftCard
