// Type Imports
import type { ExportTable } from '@/types'
import type { Client } from '@/types/entities/client'
import type { Order, OrderPackage, OrderStatus, ServiceLevel } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'
import type { Warehouse } from '@/types/entities/warehouse'

// Util Imports
import { excludeDrafts } from '@/lib/exclude-drafts'
import { haversineKm, legMinutes } from '@/lib/selectors/route-selectors'

export const SERVICE_BASE_RATE: Record<ServiceLevel, number> = { regular: 40, express: 75, same_day: 120 }
const RATE_PER_KG = 0.04

export const computeOrderTotal = (serviceLevel: ServiceLevel, packages: OrderPackage[]): number => {
  const totalWeightKg = packages.reduce((sum, p) => sum + p.weightKg, 0)

  return Math.round(SERVICE_BASE_RATE[serviceLevel] + totalWeightKg * RATE_PER_KG)
}

export const getOrderKpis = (orders: Order[]) => {
  const live = excludeDrafts(orders)

  return {
    pendingReview: live.filter(o => o.status === 'pending_review').length,
    orderReceived: live.filter(o => o.status === 'order_received').length,
    readyForShipment: live.filter(o => o.status === 'ready_for_shipment').length,
    inFulfilment: live.filter(o => o.status === 'in_fulfilment').length,

    completedThisMonth: live.filter(o => o.status === 'completed').length
  }
}

export type OrderKanbanColumnId =
  | 'pending_review'
  | 'order_received'
  | 'ready_for_shipment'
  | 'create_shipment'
  | 'in_transit'
  | 'delivered'

export const ORDER_KANBAN_COLUMNS: OrderKanbanColumnId[] = [
  'pending_review',
  'order_received',
  'ready_for_shipment',
  'create_shipment',
  'in_transit',
  'delivered'
]

export const DRAGGABLE_KANBAN_COLUMNS: OrderKanbanColumnId[] = [
  'pending_review',
  'order_received',
  'ready_for_shipment'
]

export const ORDER_KANBAN_COLUMN_LABEL: Record<OrderKanbanColumnId, string> = {
  pending_review: 'Pending review',
  order_received: 'Order received',
  ready_for_shipment: 'Order confirmed',
  create_shipment: 'Create shipment',
  in_transit: 'In transit',
  delivered: 'Delivered'
}

const MOVING_SHIPMENT_STATUSES: Shipment['status'][] = ['in_transit', 'out_for_delivery']

export const getOrderKanbanColumn = (order: Order, shipment?: Shipment): OrderKanbanColumnId | null => {
  switch (order.status) {
    case 'pending_review':
      return 'pending_review'
    case 'order_received':
      return 'order_received'
    case 'ready_for_shipment':
      return 'ready_for_shipment'
    case 'in_fulfilment':
      return shipment && MOVING_SHIPMENT_STATUSES.includes(shipment.status) ? 'in_transit' : 'create_shipment'
    case 'completed':
      return 'delivered'
    default:
      return null
  }
}

export const groupOrdersByKanbanColumn = (
  orders: Order[],
  shipments: Shipment[]
): Record<OrderKanbanColumnId, Order[]> => {
  const grouped = Object.fromEntries(ORDER_KANBAN_COLUMNS.map(column => [column, [] as Order[]])) as Record<
    OrderKanbanColumnId,
    Order[]
  >

  for (const order of orders) {
    const shipment = shipments.find(s => s.orderId === order.id)
    const column = getOrderKanbanColumn(order, shipment)

    if (column) grouped[column].push(order)
  }

  return grouped
}

const EDITABLE_ORDER_STATUSES: OrderStatus[] = [
  'draft',
  'pending_review',
  'order_received',
  'ready_for_shipment',
  'on_hold'
]

export const isOrderEditable = (order: Order): boolean => EDITABLE_ORDER_STATUSES.includes(order.status)

export type OrderLocationOption = {
  label: string
  value: string
  detail: string
  lat: number
  lng: number
}

const toCityLabel = (detail: string): string => {
  const parts = detail
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)

  return parts.slice(-2).join(', ')
}

export const getPickupLocations = (warehouses: Warehouse[]): OrderLocationOption[] =>
  warehouses.map(warehouse => ({
    label: warehouse.name,
    value: warehouse.name,
    detail: warehouse.location,
    lat: warehouse.lat,
    lng: warehouse.lng
  }))

export const getDeliveryLocations = (orders: Order[]): OrderLocationOption[] => {
  const byAddress = new Map<string, OrderLocationOption>()

  for (const order of excludeDrafts(orders)) {
    if (!order.deliveryAddress || byAddress.has(order.deliveryAddress)) continue

    byAddress.set(order.deliveryAddress, {
      label: order.deliveryAddress,
      value: order.deliveryAddress,
      detail: toCityLabel(order.deliveryAddressDetail ?? ''),
      lat: order.deliveryLat,
      lng: order.deliveryLng
    })
  }

  return [...byAddress.values()].sort((a, b) => a.value.localeCompare(b.value))
}

const EARTH_RADIUS_KM = 6371
const ROAD_FACTOR = 1.25
const URBAN_SPEED_KMH = 36
const HIGHWAY_SPEED_KMH = 75
const TOLL_PER_KM = 0.15

export const computeRouteMetrics = (
  pickup: { lat: number; lng: number },
  delivery: { lat: number; lng: number }
): { distanceKm: number; etaMinutes: number; tollEstimate: number } => {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = toRad(delivery.lat - pickup.lat)
  const dLng = toRad(delivery.lng - pickup.lng)

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(pickup.lat)) * Math.cos(toRad(delivery.lat)) * Math.sin(dLng / 2) ** 2

  const straightKm = 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
  const distanceKm = Number((straightKm * ROAD_FACTOR).toFixed(1))
  const speed = distanceKm <= 50 ? URBAN_SPEED_KMH : HIGHWAY_SPEED_KMH

  return {
    distanceKm,
    etaMinutes: Math.round((distanceKm / speed) * 60),
    tollEstimate: Number((distanceKm * TOLL_PER_KM).toFixed(2))
  }
}

export const getOrderRouteSummary = (order: Order, origin?: { lat: number; lng: number }) => {
  if (!origin) {
    return { distanceKm: order.distanceKm, etaMinutes: order.etaMinutes, tollEstimate: order.tollEstimate }
  }

  const km = haversineKm(origin.lat, origin.lng, order.deliveryLat, order.deliveryLng)

  return {
    distanceKm: Math.round(km * 10) / 10,
    etaMinutes: legMinutes(km),
    tollEstimate: order.tollEstimate
  }
}

export const buildOrdersExport = (orders: Order[], clients: Client[], shipments: Shipment[]): ExportTable => {
  const headers = [
    'Order',
    'Created',
    'Source',
    'Client',
    'Industry',
    'Pickup',
    'Delivery',
    'Service',
    'Packages',
    'Weight (kg)',
    'Shipment',
    'Total',
    'Status'
  ]

  const rows = orders.map(order => {
    const client = clients.find(c => c.id === order.clientId)
    const shipment = shipments.find(s => s.id === order.shipmentId)
    const totalQuantity = order.packages.reduce((sum, p) => sum + p.quantity, 0)
    const totalWeightKg = order.packages.reduce((sum, p) => sum + p.weightKg, 0)

    return [
      order.displayId,
      new Date(order.createdAt).toISOString(),
      order.source,
      client?.name ?? '',
      client?.industry ?? '',
      order.pickupAddress,
      order.deliveryAddress,
      order.serviceLevel,
      `${totalQuantity}`,
      `${totalWeightKg}`,
      shipment?.displayId ?? '',
      order.totalAmount.toFixed(2),
      order.status
    ]
  })

  return { headers, rows }
}
