// Type Imports
import type { DockDirection, DockStatus, Warehouse, WarehouseStatus } from '@/types/entities/warehouse'
import { WAREHOUSE_STATUS_LIST, WAREHOUSE_TYPE_LIST } from '@/types/entities/warehouse'

export const WAREHOUSE_STATUS_BADGE: Record<WarehouseStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-muted text-foreground' },
  inactive: { label: 'Inactive', className: 'bg-destructive/10 text-destructive' },
  maintenance: { label: 'Maintenance', className: 'bg-warning-soft text-warning' }
}

export const WAREHOUSE_STATUS_FILTER_OPTIONS: { label: string; value: WarehouseStatus | 'all' }[] = [
  { label: 'All status', value: 'all' },
  ...WAREHOUSE_STATUS_LIST.map(status => ({ label: WAREHOUSE_STATUS_BADGE[status].label, value: status }))
]

export const WAREHOUSE_STATUS_FORM_OPTIONS: { label: string; value: WarehouseStatus }[] = WAREHOUSE_STATUS_LIST.map(
  status => ({ label: WAREHOUSE_STATUS_BADGE[status].label, value: status })
)

export const WAREHOUSE_TYPE_OPTIONS: { label: string; value: string }[] = WAREHOUSE_TYPE_LIST.map(type => ({
  label: type,
  value: type
}))

export const DOCK_STATUS_BADGE: Record<DockStatus, { label: string; dotClassName: string }> = {
  scheduled: { label: 'Scheduled', dotClassName: 'bg-muted-foreground' },
  arriving: { label: 'Arriving', dotClassName: 'bg-info' },
  loading: { label: 'Loading', dotClassName: 'bg-warning' },
  loaded: { label: 'Loaded', dotClassName: 'bg-success' },
  completed: { label: 'Completed', dotClassName: 'bg-success' }
}

export const DOCK_DIRECTION_BADGE: Record<DockDirection, { label: string; className: string }> = {
  inbound: { label: 'Inbound', className: 'bg-info-soft text-info' },
  outbound: {
    label: 'Outbound',
    className: 'bg-violet-600/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400'
  }
}

export type UtilizationFilterValue = 'all' | 'low' | 'medium' | 'high'

export const UTILIZATION_FILTER_OPTIONS: { label: string; value: UtilizationFilterValue }[] = [
  { label: 'All utilization', value: 'all' },
  { label: 'Low (< 60%)', value: 'low' },
  { label: 'Medium (60–85%)', value: 'medium' },
  { label: 'High (> 85%)', value: 'high' }
]

export const matchesUtilization = (percent: number, filter: UtilizationFilterValue): boolean => {
  if (filter === 'all') return true
  if (filter === 'low') return percent < 60
  if (filter === 'medium') return percent >= 60 && percent <= 85

  return percent > 85
}

export const buildLocationFilterOptions = (warehouses: Warehouse[]): { label: string; value: string }[] => {
  const locations = Array.from(new Set(warehouses.map(w => w.location))).sort()

  return [
    { label: 'All locations', value: 'all' },
    ...locations.map(location => ({ label: location, value: location }))
  ]
}
