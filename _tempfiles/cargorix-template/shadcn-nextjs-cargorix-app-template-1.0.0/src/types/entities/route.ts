export type RouteStatus = 'draft' | 'planned' | 'ready' | 'in_progress' | 'completed' | 'cancelled'

export const ROUTE_STATUS_LIST: RouteStatus[] = ['draft', 'planned', 'ready', 'in_progress', 'completed', 'cancelled']

export type RouteStopStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'

export interface RouteStop {
  id: string
  orderId: string
  sequence: number

  displayId: string
  customerName: string
  address: string
  lat: number
  lng: number
  windowStart: string
  windowEnd: string
  serviceMinutes: number
  etaAt: string
  status: RouteStopStatus
  weightKg: number
  packageCount: number
}

export interface RouteActivityEvent {
  id: string
  label: string
  actor: string
  timestamp: string
  icon: 'file-plus-2' | 'route' | 'truck' | 'map-pin-check' | 'circle-check-big' | 'ban'
}

export interface Route {
  id: string
  number: string
  status: RouteStatus
  date: string
  startTime: string

  startWarehouseId: string
  returnToStart: boolean
  vehicleId?: string
  driverId?: string

  notes?: string
  stops: RouteStop[]
  activity: RouteActivityEvent[]

  isDraft?: boolean
  createdAt: string
  createdBy: string
  dispatchedAt: string | null
  completedAt: string | null
}

export interface RouteTotals {
  distanceKm: number
  durationMinutes: number
  stopCount: number
  weightKg: number
  packageCount: number
  capacityPercent: number
}

export interface RouteProgress {
  percent: number
  completedStops: number
  totalStops: number
  currentStop?: RouteStop
}
