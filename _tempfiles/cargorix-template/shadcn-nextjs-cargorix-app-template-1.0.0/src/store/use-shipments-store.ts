// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { Shipment, ShipmentStatus, ShipmentTimelineEvent } from '@/types/entities/shipment'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useOrdersStore } from '@/store/use-orders-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'

// Util Imports
import { buildDriverAssignment } from '@/lib/selectors/drivers-selectors'
import { buildVehicleTracking } from '@/lib/selectors/fleet-selectors'
import { getOrderRouteSummary } from '@/lib/selectors/orders-selectors'
import { nextDisplayId, stripDraftSuffix, toDraftDisplayId } from '@/lib/display-id'

const SHIPMENT_ID_PREFIX = 'SHP'
const SHIPMENT_ID_START = 3017

const buildEmptyShipment = (id: string, orderId: string, displayId: string): Shipment => ({
  id,
  displayId,
  orderId,
  status: 'draft',
  createdAt: new Date().toISOString(),
  serviceLevel: 'regular',
  originHub: '',
  pickupWindowStart: '',
  pickupWindowEnd: '',
  deliveryDeadline: '',
  routeType: 'Fastest route',
  distanceKm: 0,
  etaMinutes: 0,
  carrier: '',
  generateLabels: true,
  sendTrackingLink: true,
  requireProofOfDelivery: true,
  progressPercent: 0,
  priorityPackageIds: [],
  timeline: [
    { id: `${id}-tl-1`, label: 'Shipment created', timestamp: new Date().toISOString(), state: 'done' },
    { id: `${id}-tl-2`, label: 'Driver and vehicle assigned', state: 'pending' },
    { id: `${id}-tl-3`, label: 'Pickup scheduled', state: 'pending' },
    { id: `${id}-tl-4`, label: 'In transit', state: 'pending' },
    { id: `${id}-tl-5`, label: 'Delivered', state: 'pending' }
  ]
})

const PROGRESS_BY_STATUS: Partial<Record<ShipmentStatus, number>> = {
  scheduled: 0,
  in_transit: 10,
  out_for_delivery: 85,
  delivered: 100
}

const syncAssignedResources = (shipment?: Shipment) => {
  if (!shipment) return

  const order = useOrdersStore.getState().getOrder(shipment.orderId)

  if (!order) return

  if (shipment.vehicleId) {
    useVehiclesStore.getState().updateVehicle(shipment.vehicleId, buildVehicleTracking(order, shipment))
  }

  if (shipment.driverId) {
    useDriversStore.getState().updateDriver(shipment.driverId, buildDriverAssignment(order, shipment))
  }
}

const TIMELINE_STATE_BY_STATUS: Record<ShipmentStatus, ShipmentTimelineEvent['state'][]> = {
  draft: ['pending', 'pending', 'pending', 'pending', 'pending'],
  scheduled: ['done', 'done', 'current', 'pending', 'pending'],
  in_transit: ['done', 'done', 'done', 'current', 'pending'],
  out_for_delivery: ['done', 'done', 'done', 'current', 'pending'],
  delivered: ['done', 'done', 'done', 'done', 'done'],
  returned: ['done', 'done', 'done', 'done', 'done']
}

export interface RouteShipmentParams {
  orderId: string
  originHub: string
  originLat?: number
  originLng?: number
  pickupWindowStart: string
  vehicleId?: string
  driverId?: string
}

interface ShipmentsState {
  shipments: Shipment[]

  initialize: (shipments: Shipment[]) => void
  createDraftShipment: (id: string, orderId: string) => void
  createShipmentForRoute: (params: RouteShipmentParams) => string | undefined
  getShipment: (id: string) => Shipment | undefined
  getShipmentByOrderId: (orderId: string) => Shipment | undefined
  updateShipment: (id: string, updates: Partial<Shipment>) => void
  saveShipmentDraft: (id: string, updates: Partial<Shipment>) => void
  updateShipmentStatus: (id: string, status: ShipmentStatus) => void
  togglePriorityPackage: (id: string, packageId: string) => void
  scheduleShipment: (id: string) => boolean
  dispatchShipment: (id: string) => void
  markOutForDelivery: (id: string) => void
  markDelivered: (id: string) => void
}

export const useShipmentsStore = create<ShipmentsState>()((set, get) => ({
  shipments: [],

  initialize: shipments => {
    if (get().shipments.length > 0) return
    set({ shipments })
  },

  createDraftShipment: (id, orderId) => {
    if (get().shipments.some(s => s.id === id)) return

    const order = useOrdersStore.getState().getOrder(orderId)

    const displayId = toDraftDisplayId(
      nextDisplayId(
        get().shipments.map(s => s.displayId),
        SHIPMENT_ID_PREFIX,
        SHIPMENT_ID_START
      )
    )

    set(state => ({
      shipments: [
        {
          ...buildEmptyShipment(id, orderId, displayId),
          isDraft: true,
          distanceKm: order?.distanceKm ?? 0,
          etaMinutes: order?.etaMinutes ?? 0
        },
        ...state.shipments
      ]
    }))
  },

  createShipmentForRoute: ({ orderId, originHub, originLat, originLng, pickupWindowStart, vehicleId, driverId }) => {
    const existing = get().shipments.find(s => s.orderId === orderId && s.status !== 'draft')

    if (existing) return existing.id

    const order = useOrdersStore.getState().getOrder(orderId)

    if (!order) return undefined

    const leg =
      originLat !== undefined && originLng !== undefined
        ? getOrderRouteSummary(order, { lat: originLat, lng: originLng })
        : getOrderRouteSummary(order)

    const id = crypto.randomUUID()

    const displayId = nextDisplayId(
      get().shipments.map(s => s.displayId),
      SHIPMENT_ID_PREFIX,
      SHIPMENT_ID_START
    )

    set(state => ({
      shipments: [
        {
          ...buildEmptyShipment(id, orderId, displayId),
          serviceLevel: order.serviceLevel,
          originHub,
          pickupWindowStart,
          pickupWindowEnd: pickupWindowStart,
          deliveryDeadline: order.requiredDeliveryAt,
          distanceKm: leg.distanceKm,
          etaMinutes: leg.etaMinutes,
          carrier: 'Internal Fleet',
          vehicleId,
          driverId
        },
        ...state.shipments
      ]
    }))

    get().updateShipmentStatus(id, 'in_transit')
    useOrdersStore.getState().attachShipment(orderId, id)

    return id
  },

  getShipment: id => get().shipments.find(s => s.id === id),

  getShipmentByOrderId: orderId => get().shipments.find(s => s.orderId === orderId),

  updateShipment: (id, updates) =>
    set(state => ({ shipments: state.shipments.map(s => (s.id === id ? { ...s, ...updates } : s)) })),

  saveShipmentDraft: (id, updates) =>
    set(state => ({
      shipments: state.shipments.map(s => (s.id === id ? { ...s, ...updates, isDraft: false } : s))
    })),

  updateShipmentStatus: (id, status) => {
    const shipment = get().getShipment(id)

    if (!shipment) return

    const now = new Date().toISOString()
    const states = TIMELINE_STATE_BY_STATUS[status]

    get().updateShipment(id, {
      status,
      progressPercent: PROGRESS_BY_STATUS[status] ?? shipment.progressPercent,
      timeline: shipment.timeline.map((event, index) => {
        const nextState = states[index]

        if (nextState === 'done' || nextState === 'current') {
          return { ...event, state: nextState, timestamp: event.timestamp ?? now }
        }

        return { ...event, state: nextState }
      })
    })

    syncAssignedResources(get().getShipment(id))
  },

  togglePriorityPackage: (id, packageId) =>
    set(state => ({
      shipments: state.shipments.map(s =>
        s.id === id
          ? {
              ...s,
              priorityPackageIds: s.priorityPackageIds.includes(packageId)
                ? s.priorityPackageIds.filter(pid => pid !== packageId)
                : [...s.priorityPackageIds, packageId]
            }
          : s
      )
    })),

  scheduleShipment: id => {
    const shipment = get().getShipment(id)

    if (!shipment || !shipment.driverId || !shipment.vehicleId) return false

    get().updateShipment(id, { displayId: stripDraftSuffix(shipment.displayId), isDraft: false })
    get().updateShipmentStatus(id, 'scheduled')

    return true
  },

  dispatchShipment: id => get().updateShipmentStatus(id, 'in_transit'),

  markOutForDelivery: id => get().updateShipmentStatus(id, 'out_for_delivery'),

  markDelivered: id => get().updateShipmentStatus(id, 'delivered')
}))
