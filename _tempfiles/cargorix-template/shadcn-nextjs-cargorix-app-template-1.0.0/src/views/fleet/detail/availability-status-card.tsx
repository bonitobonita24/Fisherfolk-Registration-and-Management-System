// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Data Imports
import { VEHICLE_STATUS_BADGE } from '../vehicle-badges'

type AvailabilityStatusCardProps = {
  vehicle: Vehicle
}

const AVAILABILITY_LABEL: Record<string, string> = {
  available: 'Available now',
  on_route: 'On assignment',
  assigned: 'On assignment',
  maintenance: 'In maintenance',
  out_of_service: 'Out of service',
  draft: 'Not published'
}

const HEALTH_CLASS: Record<'good' | 'fair' | 'poor', string> = {
  good: 'text-success',
  fair: 'text-warning',
  poor: 'text-destructive'
}

const HEALTH_LABEL: Record<'good' | 'fair' | 'poor', string> = {
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor'
}

const AvailabilityStatusCard = ({ vehicle }: AvailabilityStatusCardProps) => {
  // Vars
  const status = vehicle.isDraft ? 'draft' : (vehicle.operationalStatus ?? 'available')
  const statusBadge = VEHICLE_STATUS_BADGE[status]
  const health = vehicle.healthStatus

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability & Status</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className='space-y-3 text-sm'>
          <div className='flex items-center justify-between gap-4'>
            <dt className='text-muted-foreground'>Operational Status</dt>
            <dd>
              <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
            </dd>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <dt className='text-muted-foreground'>Availability</dt>
            <dd className='font-medium'>{AVAILABILITY_LABEL[status]}</dd>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <dt className='text-muted-foreground'>Vehicle Health</dt>
            <dd className={`font-medium ${health ? HEALTH_CLASS[health] : ''}`}>
              {health ? HEALTH_LABEL[health] : '—'}
            </dd>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <dt className='text-muted-foreground'>Last Updated</dt>
            <dd className='font-medium'>22 May 2026</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

export default AvailabilityStatusCard
