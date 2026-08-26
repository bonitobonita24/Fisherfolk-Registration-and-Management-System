// Type Imports
import type { RouteStatus, RouteStopStatus } from '@/types/entities/route'
import { ROUTE_STATUS_LIST } from '@/types/entities/route'

export const ROUTE_STATUS_BADGE: Record<RouteStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  planned: { label: 'Planned', className: 'bg-info-soft text-info' },
  ready: { label: 'Ready', className: 'bg-primary text-primary-foreground' },
  in_progress: { label: 'In Progress', className: 'bg-warning-soft text-warning' },
  completed: { label: 'Completed', className: 'bg-success-soft text-success' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive' }
}

export const ROUTE_STATUS_OPTIONS: { label: string; value: RouteStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  ...ROUTE_STATUS_LIST.map(status => ({ label: ROUTE_STATUS_BADGE[status].label, value: status }))
]

export const ROUTE_STOP_STATUS_BADGE: Record<RouteStopStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', className: 'bg-warning-soft text-warning' },
  completed: { label: 'Completed', className: 'bg-success-soft text-success' },
  failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive' },
  skipped: { label: 'Skipped', className: 'bg-muted text-muted-foreground' }
}
