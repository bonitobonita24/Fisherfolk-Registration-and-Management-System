// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { ExportCell, ExportTable } from '@/types'
import type { Client } from '@/types/entities/client'
import type { Order, ServiceLevel } from '@/types/entities/order'
import type { Product } from '@/types/entities/product'
import type { Route } from '@/types/entities/route'
import type { Shipment } from '@/types/entities/shipment'
import type { StockMovement } from '@/types/entities/stock-movement'
import type { Vehicle } from '@/types/entities/vehicle'
import type {
  DeliveryReport,
  FleetReport,
  InventoryReport,
  MetricDelta,
  RankedBar,
  ReportBounds,
  ReportWindow,
  RevenueReport,
  TrendPoint
} from '@/types/pages/reports-types'
import { DEFAULT_REPORT_DAYS } from '@/types/pages/reports-types'
import { excludeUnsavedDrafts } from '@/lib/exclude-drafts'

const DAY_MS = 86_400_000

export const DAYS_ON_HAND_CAP = 365

const parse = (value: string): number => new Date(value.endsWith('Z') ? value : `${value}Z`).getTime()

const SERVICE_LEVEL_LABELS: Record<ServiceLevel, string> = {
  regular: 'Standard delivery',
  express: 'Express delivery',
  same_day: 'Same-day delivery'
}

export const getReportBounds = (allOrders: Order[], allShipments: Shipment[]): ReportBounds => {
  const orders = excludeUnsavedDrafts(allOrders)
  const shipments = excludeUnsavedDrafts(allShipments)

  let earliest = Number.POSITIVE_INFINITY
  let latest = 0

  for (const order of orders) {
    earliest = Math.min(earliest, parse(order.createdAt))
    latest = Math.max(latest, parse(order.createdAt))
  }

  for (const shipment of shipments) {
    earliest = Math.min(earliest, parse(shipment.createdAt))
    latest = Math.max(latest, parse(shipment.createdAt))
  }

  const end = latest === 0 ? Date.now() : latest

  return {
    start: new Date(Number.isFinite(earliest) ? earliest : end - DEFAULT_REPORT_DAYS * DAY_MS),
    end: new Date(end)
  }
}

const dayStart = (value: Date | string): number => {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value

  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

const bucketDaysFor = (days: number): number => (days <= 14 ? 1 : days <= 120 ? 7 : 30)

export const getReportWindow = (bounds: ReportBounds, from: string | null, to: string | null): ReportWindow => {
  const end = dayStart(to ? to : bounds.end) + DAY_MS
  const start = from ? dayStart(from) : end - DEFAULT_REPORT_DAYS * DAY_MS
  const days = Math.max(1, Math.round((end - start) / DAY_MS))
  const previousStart = start - days * DAY_MS

  const fmt = (ms: number) => format(new Date(ms), 'MMM d, yyyy')

  return {
    start: new Date(start),
    end: new Date(end),
    previousStart: new Date(previousStart),
    previousEnd: new Date(start),
    days,
    bucketDays: bucketDaysFor(days),
    label: `${fmt(start)} – ${fmt(end - 1)}`,
    previousLabel: `${fmt(previousStart)} – ${fmt(start - 1)}`
  }
}

const inWindow = (ms: number, from: Date, to: Date) => ms > from.getTime() && ms <= to.getTime()

const makeDelta = (current: number, previous: number, higherIsBetter: boolean): MetricDelta => {
  const value = Number((current - previous).toFixed(2))

  return { value: Math.abs(value), direction: value > 0 ? 'up' : value < 0 ? 'down' : 'flat', higherIsBetter }
}

export const isDeltaPositive = (delta: MetricDelta): boolean =>
  delta.direction === 'flat' ? true : (delta.direction === 'up') === delta.higherIsBetter

interface Bucket {
  label: string
  start: number
  end: number
}

const buildBuckets = (window: ReportWindow, previous: boolean): Bucket[] => {
  const { bucketDays } = window
  const count = Math.ceil(window.days / bucketDays)
  const edge = (previous ? window.previousEnd : window.end).getTime()
  const floor = (previous ? window.previousStart : window.start).getTime()

  return Array.from({ length: count }, (_, i) => {
    const end = edge - (count - 1 - i) * bucketDays * DAY_MS
    const start = Math.max(floor, end - bucketDays * DAY_MS)

    return {
      label: format(new Date(start + DAY_MS), bucketDays === 30 ? 'MMM yyyy' : 'MMM d'),
      start,
      end
    }
  })
}

const buildTrend = <T>(
  rows: T[],
  at: (row: T) => number,
  reduce: (rows: T[]) => number,
  window: ReportWindow,
  compare: boolean
): TrendPoint[] => {
  const collect = (bucket: Bucket) => rows.filter(row => at(row) > bucket.start && at(row) <= bucket.end)

  const current = buildBuckets(window, false)
  const previous = compare ? buildBuckets(window, true) : []

  return current.map((bucket, i) => ({
    label: bucket.label,
    current: reduce(collect(bucket)),
    previous: compare ? reduce(collect(previous[i])) : null
  }))
}

const percent = (part: number, total: number) => (total === 0 ? 0 : Number(((part / total) * 100).toFixed(1)))

const round = (value: number, digits = 1) => Number(value.toFixed(digits))

const getClosedAt = (shipment: Shipment): number | null => {
  if (shipment.status !== 'delivered' && shipment.status !== 'returned') return null

  const closing = [...shipment.timeline].reverse().find(event => event.state === 'done' && Boolean(event.timestamp))

  return closing?.timestamp ? parse(closing.timestamp) : null
}

const isOnTime = (shipment: Shipment): boolean => {
  const closedAt = getClosedAt(shipment)

  return closedAt !== null && closedAt <= parse(shipment.deliveryDeadline)
}

export const getShipmentCarriers = (shipments: Shipment[]): string[] =>
  Array.from(new Set(shipments.map(s => s.carrier))).sort()

export const getDeliveryReport = (
  shipments: Shipment[],
  window: ReportWindow,
  compare: boolean,
  carrier: string
): DeliveryReport => {
  const scoped = carrier === 'all' ? shipments : shipments.filter(s => s.carrier === carrier)

  const closed = scoped
    .map(shipment => ({ shipment, closedAt: getClosedAt(shipment) }))
    .filter((row): row is { shipment: Shipment; closedAt: number } => row.closedAt !== null)

  const current = closed.filter(row => inWindow(row.closedAt, window.start, window.end))
  const prior = closed.filter(row => inWindow(row.closedAt, window.previousStart, window.previousEnd))

  const summarise = (rows: typeof current) => {
    const delivered = rows.filter(row => row.shipment.status === 'delivered')
    const returned = rows.filter(row => row.shipment.status === 'returned')
    const onTime = delivered.filter(row => isOnTime(row.shipment)).length

    const totalDays = delivered.reduce((sum, row) => sum + (row.closedAt - parse(row.shipment.createdAt)) / DAY_MS, 0)

    return {
      deliveredCount: delivered.length,
      onTimeRate: percent(onTime, delivered.length),
      avgDeliveryDays: delivered.length === 0 ? 0 : round(totalDays / delivered.length),
      failureRate: percent(returned.length, rows.length),
      avgDistanceKm:
        rows.length === 0 ? 0 : round(rows.reduce((sum, row) => sum + row.shipment.distanceKm, 0) / rows.length)
    }
  }

  const now = summarise(current)
  const before = summarise(prior)

  const trend = buildTrend(
    closed.filter(row => row.shipment.status === 'delivered'),
    row => row.closedAt,
    rows => percent(rows.filter(row => isOnTime(row.shipment)).length, rows.length),
    window,
    compare
  )

  const carrierNames = getShipmentCarriers(current.map(row => row.shipment))

  const byCarrier: RankedBar[] = carrierNames
    .map(name => current.filter(row => row.shipment.carrier === name && row.shipment.status === 'delivered'))
    .filter(rows => rows.length > 0)
    .map(rows => {
      const name = rows[0].shipment.carrier
      const rate = percent(rows.filter(row => isOnTime(row.shipment)).length, rows.length)

      return { id: name, label: name, value: rate, percent: rate, caption: `${rows.length} delivered` }
    })
    .sort((a, b) => b.value - a.value)

  const failures = current.filter(row => row.shipment.status === 'returned')

  const reasonCounts = new Map<string, number>()

  for (const row of failures) {
    const reason = row.shipment.failureReason ?? 'Unspecified'

    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1)
  }

  const failureReasons: RankedBar[] = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({
      id: reason,
      label: reason,
      value: count,
      percent: percent(count, failures.length)
    }))
    .sort((a, b) => b.value - a.value)

  return {
    onTimeRate: now.onTimeRate,
    onTimeDelta: makeDelta(now.onTimeRate, before.onTimeRate, true),
    avgDeliveryDays: now.avgDeliveryDays,
    avgDeliveryDelta: makeDelta(now.avgDeliveryDays, before.avgDeliveryDays, false),
    failureRate: now.failureRate,
    failureDelta: makeDelta(now.failureRate, before.failureRate, false),
    avgDistanceKm: now.avgDistanceKm,
    avgDistanceDelta: makeDelta(now.avgDistanceKm, before.avgDistanceKm, false),
    deliveredCount: now.deliveredCount,
    trend,
    byCarrier,
    failureReasons
  }
}

export const getRevenueReport = (
  orders: Order[],
  clients: Client[],
  window: ReportWindow,
  compare: boolean,
  serviceLevel: ServiceLevel | 'all'
): RevenueReport => {
  const committed = orders.filter(o => o.status !== 'draft')
  const scoped = serviceLevel === 'all' ? committed : committed.filter(o => o.serviceLevel === serviceLevel)

  const pick = (from: Date, to: Date) => scoped.filter(o => inWindow(parse(o.createdAt), from, to))

  const current = pick(window.start, window.end)
  const prior = pick(window.previousStart, window.previousEnd)

  const summarise = (rows: Order[]) => {
    const billable = rows.filter(o => o.status !== 'cancelled')
    const revenue = billable.reduce((sum, o) => sum + o.totalAmount, 0)

    return {
      revenue,
      orderCount: billable.length,
      avgOrderValue: billable.length === 0 ? 0 : Math.round(revenue / billable.length),
      cancellationRate: percent(rows.filter(o => o.status === 'cancelled').length, rows.length)
    }
  }

  const now = summarise(current)
  const before = summarise(prior)

  const trend = buildTrend(
    scoped.filter(o => o.status !== 'cancelled'),
    o => parse(o.createdAt),
    rows => rows.reduce((sum, o) => sum + o.totalAmount, 0),
    window,
    compare
  )

  const billable = current.filter(o => o.status !== 'cancelled')

  const byClient = new Map<string, { revenue: number; orders: number }>()

  for (const order of billable) {
    const entry = byClient.get(order.clientId) ?? { revenue: 0, orders: 0 }

    byClient.set(order.clientId, { revenue: entry.revenue + order.totalAmount, orders: entry.orders + 1 })
  }

  const clientById = new Map(clients.map(client => [client.id, client]))

  const topClients = Array.from(byClient.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([clientId, stats], index) => {
      const client = clientById.get(clientId)

      return {
        id: clientId,
        rank: index + 1,
        name: client?.name ?? 'Unknown client',
        initials: client?.avatarInitials ?? '—',
        revenue: stats.revenue,
        orders: stats.orders
      }
    })

  const byServiceLevel: RankedBar[] = (['regular', 'express', 'same_day'] as ServiceLevel[])
    .map(level => {
      const rows = billable.filter(o => o.serviceLevel === level)
      const revenue = rows.reduce((sum, o) => sum + o.totalAmount, 0)

      return {
        id: level,
        label: SERVICE_LEVEL_LABELS[level],
        value: revenue,
        percent: percent(revenue, now.revenue),
        caption: `${rows.length} orders`
      }
    })
    .filter(row => row.value > 0)
    .sort((a, b) => b.value - a.value)

  return {
    revenue: now.revenue,
    revenueDelta: makeDelta(now.revenue, before.revenue, true),
    avgOrderValue: now.avgOrderValue,
    avgOrderValueDelta: makeDelta(now.avgOrderValue, before.avgOrderValue, true),
    orderCount: now.orderCount,
    orderCountDelta: makeDelta(now.orderCount, before.orderCount, true),
    cancellationRate: now.cancellationRate,
    cancellationDelta: makeDelta(now.cancellationRate, before.cancellationRate, false),
    trend,
    topClients,
    byServiceLevel
  }
}

export const getInventoryReport = (
  products: Product[],
  movements: StockMovement[],
  window: ReportWindow,
  warehouseId: string
): InventoryReport => {
  const live = products.filter(p => p.status !== 'draft')
  const scopedProducts = warehouseId === 'all' ? live : live.filter(p => p.warehouseId === warehouseId)
  const productIds = new Set(scopedProducts.map(p => p.id))

  const sales = movements.filter(
    m => m.type === 'sale' && productIds.has(m.productId) && inWindow(parse(m.date), window.start, window.end)
  )

  const windowDays = Math.max(1, Math.round((window.end.getTime() - window.start.getTime()) / DAY_MS))

  const soldByProduct = new Map<string, number>()

  for (const movement of sales) {
    soldByProduct.set(movement.productId, (soldByProduct.get(movement.productId) ?? 0) + Math.abs(movement.quantity))
  }

  const unitsSold = Array.from(soldByProduct.values()).reduce((sum, qty) => sum + qty, 0)

  const annualise = (sold: number, onHand: number) => (onHand === 0 ? 0 : round((sold / onHand) * (365 / windowDays)))

  const totalOnHand = scopedProducts.reduce((sum, p) => sum + p.onHand, 0)
  const turnoverRatio = annualise(unitsSold, totalOnHand)
  const daysOnHand = turnoverRatio === 0 ? 0 : Math.round(365 / turnoverRatio)

  const deadStock = scopedProducts.filter(p => (soldByProduct.get(p.id) ?? 0) === 0)
  const lowStock = scopedProducts.filter(p => p.onHand > 0 && p.onHand <= p.reorderPoint)

  const categories = new Map<string, Product[]>()

  for (const product of scopedProducts) {
    categories.set(product.category, [...(categories.get(product.category) ?? []), product])
  }

  const categoryRows = Array.from(categories.entries())
    .map(([name, items]) => {
      const sold = items.reduce((sum, p) => sum + (soldByProduct.get(p.id) ?? 0), 0)
      const onHand = items.reduce((sum, p) => sum + p.onHand, 0)

      return {
        id: `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        turnover: annualise(sold, onHand),
        unitsSold: sold,
        percent: 0
      }
    })
    .sort((a, b) => b.turnover - a.turnover)

  const maxTurnover = categoryRows[0]?.turnover ?? 0

  const byCategory = categoryRows.map(row => ({ ...row, percent: percent(row.turnover, maxTurnover) }))

  const slowestMovers = scopedProducts
    .filter(p => p.onHand > 0)
    .map(p => {
      const turnover = annualise(soldByProduct.get(p.id) ?? 0, p.onHand)

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        turnover,
        onHand: p.onHand,
        daysOnHand: turnover === 0 ? DAYS_ON_HAND_CAP : Math.min(DAYS_ON_HAND_CAP, Math.round(365 / turnover))
      }
    })

    .sort((a, b) => a.turnover - b.turnover || b.onHand - a.onHand)
    .slice(0, 5)

  return {
    turnoverRatio,
    daysOnHand,
    deadStockRate: percent(deadStock.length, scopedProducts.length),
    lowStockRate: percent(lowStock.length, scopedProducts.length),
    deadStockCount: deadStock.length,
    lowStockCount: lowStock.length,
    skuCount: scopedProducts.length,
    unitsSold,
    byCategory,
    slowestMovers
  }
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  truck: 'Truck',
  van: 'Van',
  reefer: 'Reefer',
  motorcycle: 'Motorcycle'
}

export const getFleetReport = (
  vehicles: Vehicle[],
  shipments: Shipment[],
  routes: Route[],
  window: ReportWindow,
  compare: boolean,
  vehicleType: string
): FleetReport => {
  const fleet = vehicles.filter(v => !v.isDraft && (vehicleType === 'all' || v.type === vehicleType))
  const fleetIds = new Set(fleet.map(v => v.id))

  const trips = shipments
    .filter(s => s.vehicleId !== undefined && fleetIds.has(s.vehicleId))
    .map(s => ({ shipment: s, at: parse(s.createdAt) }))

  const current = trips.filter(t => inWindow(t.at, window.start, window.end))
  const prior = trips.filter(t => inWindow(t.at, window.previousStart, window.previousEnd))

  const utilisationOf = (rows: typeof current, previousWindow: boolean) => {
    if (fleet.length === 0) return 0

    const buckets = buildBuckets(window, previousWindow)

    const shares = buckets.map(bucket => {
      const active = new Set(rows.filter(t => t.at > bucket.start && t.at <= bucket.end).map(t => t.shipment.vehicleId))

      return active.size / fleet.length
    })

    return percent(shares.reduce((sum, share) => sum + share, 0) / shares.length, 1)
  }

  const trend = (() => {
    const currentBuckets = buildBuckets(window, false)
    const previousBuckets = compare ? buildBuckets(window, true) : []

    const share = (rows: typeof current, bucket: Bucket) => {
      if (fleet.length === 0) return 0

      const active = new Set(rows.filter(t => t.at > bucket.start && t.at <= bucket.end).map(t => t.shipment.vehicleId))

      return percent(active.size, fleet.length)
    }

    return currentBuckets.map((bucket, i) => ({
      label: bucket.label,
      current: share(current, bucket),
      previous: compare ? share(prior, previousBuckets[i]) : null
    }))
  })()

  const activeRoutes = routes.filter(r => !r.isDraft && r.status !== 'cancelled')

  const avgStopsPerRoute =
    activeRoutes.length === 0
      ? 0
      : round(activeRoutes.reduce((sum, r) => sum + r.stops.length, 0) / activeRoutes.length)

  const avgDistance = (rows: typeof current) =>
    rows.length === 0 ? 0 : round(rows.reduce((sum, t) => sum + t.shipment.distanceKm, 0) / rows.length)

  const tripsByVehicle = new Map<string, number>()
  const bucketsByVehicle = new Map<string, Set<string>>()
  const currentBuckets = buildBuckets(window, false)

  for (const trip of current) {
    const id = trip.shipment.vehicleId as string

    tripsByVehicle.set(id, (tripsByVehicle.get(id) ?? 0) + 1)

    const bucket = currentBuckets.find(b => trip.at > b.start && trip.at <= b.end)

    if (bucket) {
      const seen = bucketsByVehicle.get(id) ?? new Set<string>()

      seen.add(bucket.label)
      bucketsByVehicle.set(id, seen)
    }
  }

  const topVehicles = fleet
    .map(vehicle => ({
      id: vehicle.id,
      rank: 0,
      label: vehicle.id,
      typeLabel: vehicle.name ?? VEHICLE_TYPE_LABELS[vehicle.type] ?? vehicle.type,
      trips: tripsByVehicle.get(vehicle.id) ?? 0,
      utilization: percent(bucketsByVehicle.get(vehicle.id)?.size ?? 0, currentBuckets.length)
    }))
    .filter(row => row.trips > 0)
    .sort((a, b) => b.utilization - a.utilization || b.trips - a.trips)
    .slice(0, 5)
    .map((row, index) => ({ ...row, rank: index + 1 }))

  const maintenance = [
    {
      id: 'out_of_service',
      label: 'Out of service',
      count: fleet.filter(v => v.operationalStatus === 'out_of_service').length,
      tone: 'destructive' as const
    },
    {
      id: 'in_maintenance',
      label: 'In maintenance',
      count: fleet.filter(v => v.operationalStatus === 'maintenance').length,
      tone: 'warning' as const
    },
    {
      id: 'inspection_issues',
      label: 'Open inspection issues',
      count: fleet.reduce((sum, v) => sum + (v.inspectionIssues?.length ?? 0), 0),
      tone: 'warning' as const
    },
    {
      id: 'available',
      label: 'Available now',
      count: fleet.filter(v => v.operationalStatus === 'available').length,
      tone: 'info' as const
    }
  ]

  const utilization = utilisationOf(current, false)

  return {
    utilization,
    utilizationDelta: makeDelta(utilization, utilisationOf(prior, true), true),
    avgStopsPerRoute,
    avgRouteDistanceKm: avgDistance(current),
    avgRouteDistanceDelta: makeDelta(avgDistance(current), avgDistance(prior), false),
    activeVehicles: new Set(current.map(t => t.shipment.vehicleId)).size,
    fleetSize: fleet.length,
    overdueCount: fleet.filter(v => v.operationalStatus === 'out_of_service' || v.operationalStatus === 'maintenance')
      .length,
    trend,
    topVehicles,
    maintenance
  }
}

export const buildReportExport = (
  tab: string,
  windowLabel: string,
  metrics: { label: string; value: string | number }[],
  table?: { title: string; headers: string[]; rows: (string | number)[][] }
): ExportTable => {
  const sections: ExportCell[][] = [
    ['Report', tab],
    ['Period', windowLabel],
    [],
    ...metrics.map(m => [m.label, m.value])
  ]

  if (table && table.rows.length > 0) {
    sections.push([], [table.title], table.headers, ...table.rows)
  }

  const width = Math.max(2, ...sections.map(row => row.length))
  const headers = ['Metric', 'Value', ...Array<string>(width - 2).fill('')]

  return { headers, rows: sections.map(row => [...row, ...Array<ExportCell>(width - row.length).fill('')]) }
}
