// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { Order, OrderStatus } from '@/types/entities/order'

// Util Imports
import { nextDisplayId, stripDraftSuffix, toDraftDisplayId } from '@/lib/display-id'

const ORDER_ID_PREFIX = 'OR'
const ORDER_ID_START = 2040

const buildEmptyOrder = (id: string, displayId: string): Order => ({
  isDraft: true,
  id,
  displayId,
  status: 'draft',
  source: 'manual',
  createdAt: new Date().toISOString(),
  createdBy: 'You',
  clientId: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  billingAccount: '',
  currency: 'USD',
  pickupAddress: '',
  pickupLat: 0,
  pickupLng: 0,
  deliveryAddress: '',
  deliveryLat: 0,
  deliveryLng: 0,
  requestedPickupAt: '',
  requiredDeliveryAt: '',
  serviceLevel: 'regular',
  priority: 'normal',
  packages: [],
  declaredValue: 0,
  handlingRequirement: 'standard',
  totalAmount: 0,
  distanceKm: 0,
  etaMinutes: 0,
  tollEstimate: 0,
  activity: [
    {
      id: `act-${id}-created`,
      label: 'Draft order started',
      actor: 'You',
      timestamp: new Date().toISOString(),
      icon: 'file-plus-2'
    }
  ]
})

interface OrdersState {
  orders: Order[]

  initialize: (orders: Order[]) => void
  createDraftOrder: (id: string) => void
  getOrder: (id: string) => Order | undefined
  updateOrder: (id: string, updates: Partial<Order>) => void
  saveOrderEdits: (id: string, updates: Partial<Order>) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  receiveOrder: (id: string) => void
  revertOrderTo: (id: string, status: 'pending_review' | 'order_received') => void
  confirmOrder: (id: string) => boolean
  approveOrder: (id: string) => void
  resumeOrder: (id: string) => void
  holdOrder: (id: string) => void
  attachShipment: (orderId: string, shipmentId: string) => void
  cancelOrder: (id: string) => void
  duplicateOrder: (id: string) => string
}

export const useOrdersStore = create<OrdersState>()((set, get) => ({
  orders: [],

  initialize: orders => {
    if (get().orders.length > 0) return
    set({ orders })
  },

  createDraftOrder: id => {
    if (get().orders.some(o => o.id === id)) return

    const displayId = toDraftDisplayId(
      nextDisplayId(
        get().orders.map(o => o.displayId),
        ORDER_ID_PREFIX,
        ORDER_ID_START
      )
    )

    set(state => ({ orders: [buildEmptyOrder(id, displayId), ...state.orders] }))
  },

  getOrder: id => get().orders.find(o => o.id === id),

  updateOrder: (id, updates) =>
    set(state => ({ orders: state.orders.map(o => (o.id === id ? { ...o, ...updates } : o)) })),

  saveOrderEdits: (id, updates) => {
    const order = get().getOrder(id)

    if (!order) return

    get().updateOrder(id, {
      ...updates,
      activity: [
        {
          id: `act-${id}-updated-${Date.now()}`,
          label: 'Order updated',
          actor: 'You',
          timestamp: new Date().toISOString(),
          icon: 'file-plus-2'
        },
        ...order.activity
      ]
    })
  },

  updateOrderStatus: (id, status) => get().updateOrder(id, { status }),

  confirmOrder: id => {
    const order = get().getOrder(id)

    if (!order) return false

    const isValid = Boolean(order.clientId && order.pickupAddress && order.deliveryAddress && order.packages.length > 0)

    if (!isValid) return false

    get().updateOrder(id, {
      status: 'pending_review',
      displayId: stripDraftSuffix(order.displayId),
      activity: [
        {
          id: `act-${id}-confirmed-${Date.now()}`,
          label: 'Manual order created',
          actor: 'You',
          timestamp: new Date().toISOString(),
          icon: 'file-plus-2'
        },
        ...order.activity
      ]
    })

    return true
  },

  receiveOrder: id => {
    const order = get().getOrder(id)

    if (!order || order.status !== 'pending_review') return

    get().updateOrder(id, {
      status: 'order_received',
      activity: [
        {
          id: `act-${id}-received-${Date.now()}`,
          label: 'Order received',
          actor: 'You',
          timestamp: new Date().toISOString(),
          icon: 'badge-check'
        },
        ...order.activity
      ]
    })
  },

  approveOrder: id => {
    const order = get().getOrder(id)

    if (!order || order.status !== 'order_received') return

    get().updateOrder(id, {
      status: 'ready_for_shipment',
      activity: [
        {
          id: `act-${id}-approved-${Date.now()}`,
          label: 'Order confirmed',
          actor: 'You',
          timestamp: new Date().toISOString(),
          icon: 'badge-check'
        },
        ...order.activity
      ]
    })
  },

  resumeOrder: id => {
    const order = get().getOrder(id)

    if (!order || order.status !== 'on_hold') return

    get().updateOrder(id, {
      status: 'pending_review',
      activity: [
        {
          id: `act-${id}-resumed-${Date.now()}`,
          label: 'Hold released — back to review',
          actor: 'You',
          timestamp: new Date().toISOString(),
          icon: 'play'
        },
        ...order.activity
      ]
    })
  },

  holdOrder: id => {
    const order = get().getOrder(id)

    if (!order || !['pending_review', 'order_received', 'ready_for_shipment'].includes(order.status)) return

    get().updateOrder(id, {
      status: 'on_hold',
      activity: [
        {
          id: `act-${id}-held-${Date.now()}`,
          label: 'Order put on hold',
          actor: 'You',
          timestamp: new Date().toISOString(),
          icon: 'pause'
        },
        ...order.activity
      ]
    })
  },

  revertOrderTo: (id, status) => {
    const order = get().getOrder(id)

    if (!order || order.status === status) return

    const label = status === 'pending_review' ? 'Moved back to pending review' : 'Moved back to order received'

    get().updateOrder(id, {
      status,
      activity: [
        {
          id: `act-${id}-reverted-${Date.now()}`,
          label,
          actor: 'You',
          timestamp: new Date().toISOString(),
          icon: 'play'
        },
        ...order.activity
      ]
    })
  },

  attachShipment: (orderId, shipmentId) => get().updateOrder(orderId, { shipmentId, status: 'in_fulfilment' }),

  cancelOrder: id => {
    const order = get().getOrder(id)

    if (!order) return

    get().updateOrder(id, {
      status: 'cancelled',
      activity: [
        {
          id: `act-${id}-cancelled-${Date.now()}`,
          label: 'Order cancelled',
          actor: 'You',
          timestamp: new Date().toISOString(),
          icon: 'ban'
        },
        ...order.activity
      ]
    })
  },

  duplicateOrder: id => {
    const source = get().getOrder(id)

    if (!source) return ''

    const newId = crypto.randomUUID()

    const duplicate: Order = {
      ...source,
      id: newId,
      displayId: toDraftDisplayId(
        nextDisplayId(
          get().orders.map(o => o.displayId),
          ORDER_ID_PREFIX,
          ORDER_ID_START
        )
      ),
      isDraft: false,
      status: 'draft',
      createdAt: new Date().toISOString(),
      createdBy: 'You',
      shipmentId: undefined,
      activity: [
        {
          id: `act-${newId}-created`,
          label: `Duplicated from ${source.displayId}`,
          actor: 'You',
          timestamp: new Date().toISOString(),
          icon: 'file-plus-2'
        }
      ]
    }

    set(state => ({ orders: [duplicate, ...state.orders] }))

    return newId
  }
}))
