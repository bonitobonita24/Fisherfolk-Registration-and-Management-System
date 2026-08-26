// Type Imports
import type { Order } from '@/types/entities/order'
import type { Route, RouteActivityEvent, RouteStatus, RouteStop, RouteStopStatus } from '@/types/entities/route'

// Util Imports
import { haversineKm, legMinutes } from '@/lib/selectors/route-selectors'

// Data Imports
import { db as ordersDb } from '@/fake-db/entities/orders'
import { db as vehiclesDb } from '@/fake-db/entities/vehicles'
import { db as driversDb } from '@/fake-db/entities/drivers'
import { TEAM_MEMBERS } from '@/fake-db/entities/team-members'

const DAY = 24 * 60 * 60 * 1000
const MINUTE = 60 * 1000

const START_WAREHOUSE_ID = 'wh-newark'
const START_LAT = 40.7357
const START_LNG = -74.1724

const EARLIEST_START = 5 * 60
const LATEST_START = 18 * 60
const DEFAULT_START = 8 * 60

const pad = (n: number, len = 3) => `${n}`.padStart(len, '0')

const naive = (ms: number) => {
  const d = new Date(ms)
  const pad2 = (n: number) => `${n}`.padStart(2, '0')

  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`
}

const dayMs = (date: string) => Date.parse(`${date}T00:00:00Z`)
const at = (date: string, dayShift: number, minutes: number) => naive(dayMs(date) + dayShift * DAY + minutes * MINUTE)
const timeOfDay = (timestamp: string) => Number(timestamp.slice(11, 13)) * 60 + Number(timestamp.slice(14, 16))
const clock = (minutes: number) => `${pad(Math.floor(minutes / 60), 2)}:${pad(minutes % 60, 2)}`

const wallMs = (timestamp: string) => Date.parse(`${timestamp.slice(0, 19)}Z`)

const vehicleIds = vehiclesDb.map(v => v.id)
const capacityKg = new Map(vehiclesDb.map(v => [v.id, Math.round(v.capacityTons * 1000)]))
const driverIds = driversDb.map(d => d.id)
const driverName = (id?: string) => driversDb.find(d => d.id === id)?.name ?? 'Dispatch Desk'

const byDeliveryDay = (list: Order[]) => {
  const groups = new Map<string, Order[]>()

  for (const order of list) {
    const day = order.requiredDeliveryAt.slice(0, 10)
    const bucket = groups.get(day)

    if (bucket) bucket.push(order)
    else groups.set(day, [order])
  }

  return groups
}

const POOLS = {
  past: byDeliveryDay(ordersDb.filter(o => o.status === 'completed' || o.status === 'in_fulfilment')),
  ready: byDeliveryDay(ordersDb.filter(o => o.status === 'ready_for_shipment'))
}

type PoolName = keyof typeof POOLS
type Plan = { status: RouteStatus; pool: PoolName; draw: [string, number][] }

const PLAN: Plan[] = [
  { status: 'completed', pool: 'past', draw: [['2026-07-20', 3]] },
  { status: 'completed', pool: 'past', draw: [['2026-07-21', 4]] },
  { status: 'completed', pool: 'past', draw: [['2026-07-22', 5]] },
  { status: 'completed', pool: 'past', draw: [['2026-07-23', 4]] },
  { status: 'completed', pool: 'past', draw: [['2026-07-24', 3]] },
  { status: 'in_progress', pool: 'past', draw: [['2026-07-24', 3]] },
  {
    status: 'in_progress',
    pool: 'past',
    draw: [
      ['2026-07-25', 2],
      ['2026-07-26', 1]
    ]
  },
  { status: 'cancelled', pool: 'ready', draw: [['2026-07-22', 3]] },
  { status: 'ready', pool: 'ready', draw: [['2026-07-22', 3]] },
  { status: 'ready', pool: 'ready', draw: [['2026-07-23', 3]] },
  { status: 'planned', pool: 'ready', draw: [['2026-07-23', 4]] },
  { status: 'planned', pool: 'ready', draw: [['2026-07-24', 4]] },
  { status: 'planned', pool: 'ready', draw: [['2026-07-24', 3]] },
  {
    status: 'draft',
    pool: 'ready',
    draw: [
      ['2026-07-26', 2],
      ['2026-07-27', 1]
    ]
  }
]

const NO_DRIVER = new Set([10, 12, 13])
const NO_VEHICLE = new Set([11])

const cursors = new Map<string, number>()

const drawOrders = (pool: PoolName, draw: [string, number][]): Order[] => {
  const picked: Order[] = []

  for (const [day, count] of draw) {
    const key = `${pool}::${day}`
    const start = cursors.get(key) ?? 0

    picked.push(...(POOLS[pool].get(day) ?? []).slice(start, start + count))
    cursors.set(key, start + count)
  }

  return picked
}

const routeDate = (orders: Order[]) => {
  const days = orders.map(o => o.requiredDeliveryAt.slice(0, 10)).sort()

  return days[Math.floor(days.length / 2)]
}

const serviceMinutesFor = (index: number, stop: number) => 10 + ((index + stop) % 3) * 5

const etaOffsets = (index: number, orders: Order[]) => {
  const offsets: number[] = []

  let elapsed = 0
  let prevLat = START_LAT
  let prevLng = START_LNG

  orders.forEach((order, i) => {
    if (i > 0) elapsed += serviceMinutesFor(index, i - 1)
    elapsed += legMinutes(haversineKm(prevLat, prevLng, order.deliveryLat, order.deliveryLng))
    offsets.push(elapsed)
    prevLat = order.deliveryLat
    prevLng = order.deliveryLng
  })

  return offsets
}

const startMinutesFor = (date: string, orders: Order[], offsets: number[]) => {
  const hits = (start: number) =>
    orders.filter((o, i) => {
      const eta = dayMs(date) + (start + offsets[i]) * MINUTE

      return eta >= wallMs(o.requestedPickupAt) && eta <= wallMs(o.requiredDeliveryAt)
    }).length

  let best = DEFAULT_START
  let bestHits = hits(DEFAULT_START)

  for (let start = EARLIEST_START; start <= LATEST_START; start += 15) {
    const scored = hits(start)

    if (scored > bestHits) {
      bestHits = scored
      best = start
    }
  }

  return best
}

const stopStatusFor = (routeStatus: RouteStatus, index: number, total: number): RouteStopStatus => {
  if (routeStatus === 'completed') return 'completed'

  if (routeStatus === 'in_progress') {
    const cut = Math.floor(total / 2)

    return index < cut ? 'completed' : index === cut ? 'in_progress' : 'pending'
  }

  return 'pending'
}

const distanceRank = (order: Order) => (order.deliveryLat - START_LAT) ** 2 + (order.deliveryLng - START_LNG) ** 2

type StopsInput = {
  index: number
  status: RouteStatus
  date: string
  start: number
  orders: Order[]
  offsets: number[]
}

const buildStops = ({ index, status, date, start, orders, offsets }: StopsInput): RouteStop[] => {
  const stops: RouteStop[] = []

  orders.forEach((order, i) => {
    stops.push({
      id: `rts-${pad(index + 1)}-${pad(i + 1, 2)}`,
      orderId: order.id,
      sequence: i + 1,

      displayId: order.displayId,
      customerName: order.contactName,
      address: order.deliveryAddress,
      lat: order.deliveryLat,
      lng: order.deliveryLng,
      windowStart: order.requestedPickupAt,
      windowEnd: order.requiredDeliveryAt,
      serviceMinutes: serviceMinutesFor(index, i),
      etaAt: at(date, 0, start + offsets[i]),
      status: stopStatusFor(status, i, orders.length),
      weightKg: order.packages.reduce((sum, p) => sum + p.weightKg, 0),
      packageCount: order.packages.reduce((sum, p) => sum + p.quantity, 0)
    })
  })

  return stops
}

const usedVehicles = new Map<string, Set<string>>()
const usedDrivers = new Map<string, Set<string>>()

const claim = (used: Map<string, Set<string>>, date: string, id: string) => {
  const taken = used.get(date) ?? new Set<string>()

  taken.add(id)
  used.set(date, taken)

  return id
}

const pickVehicle = (index: number, date: string, weightKg: number) => {
  const taken = usedVehicles.get(date)
  const fits = vehicleIds.filter(id => !taken?.has(id) && (capacityKg.get(id) ?? 0) >= weightKg)
  const pool = fits.length > 0 ? fits : vehicleIds

  return claim(usedVehicles, date, pool[(index * 5) % pool.length])
}

const pickDriver = (index: number, date: string) => {
  const taken = usedDrivers.get(date)
  const free = driverIds.filter(id => !taken?.has(id))
  const pool = free.length > 0 ? free : driverIds

  return claim(usedDrivers, date, pool[(index * 7) % pool.length])
}

type ActivityInput = {
  index: number
  plan: Plan
  stops: RouteStop[]
  date: string
  createdBy: string
  driver: string
  createdAt: string
  sequencedAt: string
  dispatchedAt: string | null
  completedAt: string | null
}

const buildActivity = (input: ActivityInput): RouteActivityEvent[] => {
  const { index, plan, stops, date, createdBy, driver, createdAt, sequencedAt, dispatchedAt, completedAt } = input
  const events: RouteActivityEvent[] = []
  const delivered = stops.filter(s => s.status === 'completed')

  let seq = 0

  const push = (label: string, actor: string, timestamp: string, icon: RouteActivityEvent['icon']) => {
    events.push({ id: `ract-${pad(index + 1)}-${pad(++seq, 2)}`, label, actor, timestamp, icon })
  }

  if (plan.status === 'cancelled') {
    push('Route cancelled', createdBy, at(date, -1, 16 * 60), 'ban')
    push('Stops sequenced', createdBy, sequencedAt, 'route')
    push('Route created', createdBy, createdAt, 'file-plus-2')

    return events
  }

  if (completedAt) push('Route completed', 'System', completedAt, 'circle-check-big')

  if (delivered.length > 0)
    push(
      `${delivered.length} of ${stops.length} stops delivered`,
      driver,
      delivered[delivered.length - 1].etaAt,
      'map-pin-check'
    )

  if (dispatchedAt) push('Dispatched', driver, dispatchedAt, 'truck')
  if (plan.status === 'ready') push('Marked ready for dispatch', createdBy, at(date, -2, 13 * 60), 'circle-check-big')
  if (plan.status !== 'draft') push('Stops sequenced', createdBy, sequencedAt, 'route')
  push('Route created', createdBy, createdAt, 'file-plus-2')

  return events
}

const buildRoute = (index: number): Route => {
  const plan = PLAN[index]
  const orders = drawOrders(plan.pool, plan.draw).sort((a, b) => distanceRank(a) - distanceRank(b))
  const date = routeDate(orders)
  const offsets = etaOffsets(index, orders)
  const start = startMinutesFor(date, orders, offsets)
  const stops = buildStops({ index, status: plan.status, date, start, orders, offsets })

  const createdBy = TEAM_MEMBERS[index % TEAM_MEMBERS.length]
  const createdAt = at(date, -3, 9 * 60 + (index % 5) * 7)
  const sequencedAt = at(date, -3, 11 * 60 + (index % 4) * 9)

  const weightKg = stops.reduce((sum, s) => sum + s.weightKg, 0)
  const vehicleId = NO_VEHICLE.has(index) ? undefined : pickVehicle(index, date, weightKg)
  const driverId = NO_DRIVER.has(index) ? undefined : pickDriver(index, date)

  const isLive = plan.status === 'in_progress' || plan.status === 'completed'
  const dispatchedAt = isLive ? at(date, 0, start) : null
  const lastStop = stops[stops.length - 1]

  const completedAt =
    plan.status === 'completed' ? at(date, 0, timeOfDay(lastStop.etaAt) + lastStop.serviceMinutes + 25) : null

  return {
    id: `route-${pad(index + 1)}`,
    number: `RT-2026-${pad(170 + index, 4)}`,
    status: plan.status,
    date,
    startTime: clock(start),

    startWarehouseId: START_WAREHOUSE_ID,
    returnToStart: index % 4 !== 2,
    vehicleId,
    driverId,

    notes: index % 3 === 0 ? 'Metro delivery loop — confirm dock release with the yard before departure.' : undefined,
    stops,
    activity: buildActivity({
      index,
      plan,
      stops,
      date,
      createdBy,
      driver: driverName(driverId),
      createdAt,
      sequencedAt,
      dispatchedAt,
      completedAt
    }),

    isDraft: plan.status === 'draft' ? true : undefined,
    createdAt,
    createdBy,
    dispatchedAt,
    completedAt
  }
}

export const db: Route[] = PLAN.map((_, index) => buildRoute(index))
