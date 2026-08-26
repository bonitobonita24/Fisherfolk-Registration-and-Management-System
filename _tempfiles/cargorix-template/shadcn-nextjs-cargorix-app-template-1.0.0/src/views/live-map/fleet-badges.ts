// Type Imports
import type { VehicleTrackingStatus } from '@/types/entities/vehicle'

export const VEHICLE_STATUS_OPTIONS: { label: string; value: VehicleTrackingStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'On route', value: 'on_route' },
  { label: 'Delayed', value: 'delayed' },
  { label: 'Finished', value: 'completed' },
  { label: 'Idle / Standby', value: 'idle' }
]

export const VEHICLE_STATUS_BADGE: Record<VehicleTrackingStatus, { label: string; className: string }> = {
  on_route: { label: 'On Route', className: 'bg-primary text-primary-foreground' },
  delayed: { label: 'Delayed', className: 'bg-warning-soft text-warning' },
  completed: {
    label: 'Finished',
    className: 'bg-success-soft text-success'
  },
  idle: { label: 'Idle', className: 'bg-muted text-muted-foreground' }
}
