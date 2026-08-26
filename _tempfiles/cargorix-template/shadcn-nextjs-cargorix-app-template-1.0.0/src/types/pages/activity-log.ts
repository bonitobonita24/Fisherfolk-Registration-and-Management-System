export const DEFAULT_ACTIVITY_DAYS = 10

export type ActivityResult = 'success' | 'warning' | 'failed'

export type ActivityModule =
  | 'Purchasing'
  | 'Shipments'
  | 'Inventory'
  | 'Transportation'
  | 'Warehouse'
  | 'Administration'
  | 'Integrations'
  | 'Authentication'

export const ACTIVITY_RESULT_LABEL: Record<ActivityResult, string> = {
  success: 'Success',
  warning: 'Warning',
  failed: 'Failed'
}

export interface ActivityEvent {
  id: string
  at: string
  userId: string | null
  userName: string
  action: string
  module: ActivityModule
  record: string
  recordHref: string | null
  result: ActivityResult
  ip: string
  device: string
}

export interface ActivityFilters {
  search: string
  from: string
  to: string
}

export interface ActivityBounds {
  first: Date
  last: Date
}

export interface ActivityStats {
  totalToday: number
  failedToday: number
  topModule: string
}
