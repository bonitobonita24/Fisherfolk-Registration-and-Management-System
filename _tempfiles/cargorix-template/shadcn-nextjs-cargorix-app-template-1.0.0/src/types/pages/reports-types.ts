export type ReportTab = 'delivery' | 'revenue' | 'inventory' | 'fleet'

export const REPORT_TABS: { value: ReportTab; label: string }[] = [
  { value: 'delivery', label: 'Delivery Performance' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'inventory', label: 'Inventory Turnover' },
  { value: 'fleet', label: 'Fleet Efficiency' }
]

export const DEFAULT_REPORT_DAYS = 84

export interface ReportBounds {
  start: Date
  end: Date
}

export interface ReportWindow {
  start: Date
  end: Date
  previousStart: Date
  previousEnd: Date
  days: number
  bucketDays: number
  label: string
  previousLabel: string
}

export type DeltaDirection = 'up' | 'down' | 'flat'

export interface MetricDelta {
  value: number
  direction: DeltaDirection

  higherIsBetter: boolean
}

export interface TrendPoint {
  label: string
  current: number
  previous: number | null
}

export interface RankedBar {
  id: string
  label: string
  value: number
  percent: number
  caption?: string
}

export interface DeliveryReport {
  onTimeRate: number
  onTimeDelta: MetricDelta
  avgDeliveryDays: number
  avgDeliveryDelta: MetricDelta
  failureRate: number
  failureDelta: MetricDelta
  avgDistanceKm: number
  avgDistanceDelta: MetricDelta
  deliveredCount: number
  trend: TrendPoint[]
  byCarrier: RankedBar[]
  failureReasons: RankedBar[]
}

export interface TopClientRow {
  id: string
  rank: number
  name: string
  initials: string
  revenue: number
  orders: number
}

export interface RevenueReport {
  revenue: number
  revenueDelta: MetricDelta
  avgOrderValue: number
  avgOrderValueDelta: MetricDelta
  orderCount: number
  orderCountDelta: MetricDelta
  cancellationRate: number
  cancellationDelta: MetricDelta
  trend: TrendPoint[]
  topClients: TopClientRow[]
  byServiceLevel: RankedBar[]
}

export interface CategoryTurnoverRow {
  id: string
  name: string
  turnover: number
  percent: number
  unitsSold: number
}

export interface SlowestMoverRow {
  id: string
  name: string
  sku: string
  daysOnHand: number
  turnover: number
  onHand: number
}

export interface InventoryReport {
  turnoverRatio: number
  daysOnHand: number
  deadStockRate: number
  lowStockRate: number
  deadStockCount: number
  lowStockCount: number
  skuCount: number
  unitsSold: number
  byCategory: CategoryTurnoverRow[]
  slowestMovers: SlowestMoverRow[]
}

export interface TopVehicleRow {
  id: string
  rank: number
  label: string
  typeLabel: string
  utilization: number
  trips: number
}

export interface MaintenanceRollupRow {
  id: string
  label: string
  count: number
  tone: 'destructive' | 'warning' | 'info'
}

export interface FleetReport {
  utilization: number
  utilizationDelta: MetricDelta
  avgStopsPerRoute: number
  avgRouteDistanceKm: number
  avgRouteDistanceDelta: MetricDelta
  activeVehicles: number
  fleetSize: number
  overdueCount: number
  trend: TrendPoint[]
  topVehicles: TopVehicleRow[]
  maintenance: MaintenanceRollupRow[]
}
