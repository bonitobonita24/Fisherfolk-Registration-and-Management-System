// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { ExportTable } from '@/types'
import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Route, RouteProgress, RouteStop, RouteTotals } from '@/types/entities/route'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Util Imports
import { getCapacityKg } from '@/lib/selectors/fleet-selectors'

export const AVG_SPEED_KMH = 30

const MINUTE = 60 * 1000

const parseNaive = (date: string, time: string) => Date.parse(`${date.slice(0, 10)}T${time.slice(0, 5)}:00Z`)
const formatNaive = (ms: number) => new Date(ms).toISOString().slice(0, 19)

export const haversineKm = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const lat1 = (aLat * Math.PI) / 180
  const lat2 = (bLat * Math.PI) / 180

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)

  return 2 * R * Math.asin(Math.sqrt(h))
}

export const resequence = (stops: RouteStop[]): RouteStop[] =>
  stops.map((stop, index) => ({ ...stop, sequence: index + 1 }))

export const pathKm = (stops: RouteStop[], warehouse: Warehouse, returnToStart: boolean): number => {
  let total = 0
  let prevLat = warehouse.lat
  let prevLng = warehouse.lng

  for (const stop of stops) {
    total += haversineKm(prevLat, prevLng, stop.lat, stop.lng)
    prevLat = stop.lat
    prevLng = stop.lng
  }

  if (returnToStart) total += haversineKm(prevLat, prevLng, warehouse.lat, warehouse.lng)

  return total
}

export const getRouteDistanceKm = (route: Route, warehouse?: Warehouse): number => {
  if (!warehouse || route.stops.length === 0) return 0

  return Math.round(pathKm(route.stops, warehouse, route.returnToStart) * 10) / 10
}

export const legMinutes = (km: number): number => Math.round((km / AVG_SPEED_KMH) * 60)

export const travelMinutes = (stops: RouteStop[], warehouse: Warehouse, returnToStart: boolean): number => {
  let total = 0
  let prevLat = warehouse.lat
  let prevLng = warehouse.lng

  for (const stop of stops) {
    total += legMinutes(haversineKm(prevLat, prevLng, stop.lat, stop.lng))
    prevLat = stop.lat
    prevLng = stop.lng
  }

  if (returnToStart) total += legMinutes(haversineKm(prevLat, prevLng, warehouse.lat, warehouse.lng))

  return total
}

export const getRouteTotals = (route: Route, warehouse?: Warehouse, vehicle?: Vehicle): RouteTotals => {
  const distanceKm = getRouteDistanceKm(route, warehouse)
  const serviceMinutes = route.stops.reduce((sum, s) => sum + s.serviceMinutes, 0)
  const weightKg = route.stops.reduce((sum, s) => sum + s.weightKg, 0)
  const packageCount = route.stops.reduce((sum, s) => sum + s.packageCount, 0)
  const capacityKg = vehicle ? getCapacityKg(vehicle) : 0

  return {
    distanceKm,
    durationMinutes:
      warehouse && route.stops.length > 0
        ? travelMinutes(route.stops, warehouse, route.returnToStart) + serviceMinutes
        : serviceMinutes,
    stopCount: route.stops.length,
    weightKg,
    packageCount,
    capacityPercent: capacityKg > 0 ? Math.min(100, Math.round((weightKg / capacityKg) * 100)) : 0
  }
}

export const computeEtas = (
  stops: RouteStop[],
  warehouse: Warehouse | undefined,
  date: string,
  startTime: string
): RouteStop[] => {
  if (!warehouse) return stops

  let cursorMs = parseNaive(date, startTime || '00:00')

  if (!Number.isFinite(cursorMs)) return stops

  let prevLat = warehouse.lat
  let prevLng = warehouse.lng

  return stops.map(stop => {
    cursorMs += legMinutes(haversineKm(prevLat, prevLng, stop.lat, stop.lng)) * MINUTE

    const etaAt = formatNaive(cursorMs)

    cursorMs += stop.serviceMinutes * MINUTE
    prevLat = stop.lat
    prevLng = stop.lng

    return { ...stop, etaAt }
  })
}

export type OptimizeMode = 'distance' | 'windows'

export const OPTIMIZE_MODE_OPTIONS: { label: string; value: OptimizeMode }[] = [
  { label: 'Shortest distance', value: 'distance' },
  { label: 'Time windows', value: 'windows' }
]

export const EXACT_MAX_STOPS = 8

export const isExactlyOptimisable = (stopCount: number): boolean => stopCount <= EXACT_MAX_STOPS

const nearestNeighbourOrder = (stops: RouteStop[], warehouse: Warehouse): RouteStop[] => {
  const remaining = [...stops]
  const ordered: RouteStop[] = []
  let curLat = warehouse.lat
  let curLng = warehouse.lng

  while (remaining.length > 0) {
    let bestIndex = 0
    let bestDistance = Infinity

    remaining.forEach((stop, index) => {
      const d = haversineKm(curLat, curLng, stop.lat, stop.lng)

      if (d < bestDistance) {
        bestDistance = d
        bestIndex = index
      }
    })

    const [next] = remaining.splice(bestIndex, 1)

    ordered.push(next)
    curLat = next.lat
    curLng = next.lng
  }

  return ordered
}

const exactOrder = (stops: RouteStop[], warehouse: Warehouse, returnToStart: boolean): RouteStop[] => {
  const n = stops.length
  const used = new Array<boolean>(n).fill(false)
  const current: RouteStop[] = []

  const greedy = nearestNeighbourOrder(stops, warehouse)
  const greedyKm = pathKm(greedy, warehouse, returnToStart)
  const inputKm = pathKm(stops, warehouse, returnToStart)

  let best = greedyKm < inputKm ? greedy : stops
  let bestKm = greedyKm < inputKm ? greedyKm : inputKm

  const walk = (lat: number, lng: number, km: number) => {
    if (km >= bestKm) return

    if (current.length === n) {
      const total = km + (returnToStart ? haversineKm(lat, lng, warehouse.lat, warehouse.lng) : 0)

      if (total < bestKm) {
        bestKm = total
        best = [...current]
      }

      return
    }

    for (let i = 0; i < n; i++) {
      if (used[i]) continue

      const stop = stops[i]

      used[i] = true
      current.push(stop)
      walk(stop.lat, stop.lng, km + haversineKm(lat, lng, stop.lat, stop.lng))
      current.pop()
      used[i] = false
    }
  }

  walk(warehouse.lat, warehouse.lng, 0)

  return best
}

export const optimizeStops = (
  stops: RouteStop[],
  warehouse: Warehouse | undefined,
  mode: OptimizeMode,
  returnToStart: boolean
): RouteStop[] => {
  if (stops.length < 2) return resequence(stops)

  if (mode === 'windows') return resequence([...stops].sort((a, b) => a.windowStart.localeCompare(b.windowStart)))

  if (!warehouse) return resequence(stops)

  if (stops.length <= EXACT_MAX_STOPS) return resequence(exactOrder(stops, warehouse, returnToStart))

  const ordered = nearestNeighbourOrder(stops, warehouse)
  const improved = pathKm(ordered, warehouse, returnToStart) < pathKm(stops, warehouse, returnToStart)

  return resequence(improved ? ordered : stops)
}

export const getUnassignedOrders = (orders: Order[], routes: Route[]): Order[] => {
  const assigned = new Set(routes.filter(r => r.status !== 'cancelled').flatMap(r => r.stops.map(s => s.orderId)))

  return orders.filter(o => !assigned.has(o.id) && o.status === 'ready_for_shipment')
}

export const getRouteForOrder = (orderId: string, routes: Route[]): Route | undefined =>
  routes.find(
    route =>
      route.status !== 'draft' && route.status !== 'cancelled' && route.stops.some(stop => stop.orderId === orderId)
  )

export const getRouteProgress = (route: Route): RouteProgress => {
  const totalStops = route.stops.length
  const completedStops = route.stops.filter(s => s.status === 'completed').length

  return {
    percent: totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0,
    completedStops,
    totalStops,
    currentStop: route.stops.find(s => s.status === 'in_progress')
  }
}

export const getRouteReadiness = (route: Route): { label: string; done: boolean }[] => [
  { label: 'Stops assigned', done: route.stops.length > 0 },
  { label: 'Start warehouse selected', done: Boolean(route.startWarehouseId) },
  { label: 'Vehicle assigned', done: Boolean(route.vehicleId) },
  { label: 'Driver assigned', done: Boolean(route.driverId) },
  { label: 'Schedule set', done: Boolean(route.date && route.startTime) }
]

export const nextRouteNumber = (routes: Route[]): string => {
  const year = new Date().getFullYear()

  const highest = routes.reduce((max, r) => {
    const n = Number(r.number.split('-')[2])

    return Number.isFinite(n) && n > max ? n : max
  }, 0)

  return `RT-${year}-${String(highest + 1).padStart(4, '0')}`
}

export const getRouteKpis = (routes: Route[]) => {
  const live = routes.filter(r => !r.isDraft)

  return {
    totalRoutes: live.length,
    inProgress: live.filter(r => r.status === 'in_progress').length,
    readyToDispatch: live.filter(r => r.status === 'ready').length,
    completed: live.filter(r => r.status === 'completed').length
  }
}

export interface RoutesCsvContext {
  drivers: Driver[]
  vehicles: Vehicle[]
  warehouses: Warehouse[]
  getStatusLabel: (route: Route) => string
}

export const buildRoutesExport = (list: Route[], context: RoutesCsvContext): ExportTable => {
  const { drivers, vehicles, warehouses, getStatusLabel } = context

  const headers = [
    'Route',
    'Start Time',
    'Date',
    'Origin',
    'Origin Code',
    'Stops',
    'Driver',
    'Vehicle',
    'Vehicle ID',
    'Distance (km)',
    'Duration',
    'Packages',
    'Weight (kg)',
    'Status'
  ]

  const driverById = new Map(drivers.map(d => [d.id, d]))
  const vehicleById = new Map(vehicles.map(v => [v.id, v]))
  const warehouseById = new Map(warehouses.map(w => [w.id, w]))

  const rows = list.map(row => {
    const warehouse = warehouseById.get(row.startWarehouseId)
    const driver = row.driverId ? driverById.get(row.driverId) : undefined
    const vehicle = row.vehicleId ? vehicleById.get(row.vehicleId) : undefined
    const totals = getRouteTotals(row, warehouse, vehicle)

    return [
      row.number,
      row.startTime,
      row.date ? format(new Date(row.date), 'dd MMM yyyy') : '',
      warehouse?.name ?? '',
      warehouse?.code ?? '',
      `${row.stops.length}`,
      driver?.name ?? '',
      vehicle ? (vehicle.registrationNo ?? vehicle.id) : '',
      vehicle ? vehicle.id.toUpperCase() : '',
      `${totals.distanceKm}`,
      `${Math.floor(totals.durationMinutes / 60)}h ${totals.durationMinutes % 60}m`,
      `${totals.packageCount}`,
      `${totals.weightKg}`,
      getStatusLabel(row)
    ]
  })

  return { headers, rows }
}
