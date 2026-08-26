// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { Route, RouteActivityEvent, RouteStop } from '@/types/entities/route'
import type { Warehouse } from '@/types/entities/warehouse'

// Store Imports
import { useShipmentsStore } from '@/store/use-shipments-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { computeEtas, getRouteDistanceKm, nextRouteNumber, resequence } from '@/lib/selectors/route-selectors'

const CURRENT_OPERATOR = 'You'

const now = () => new Date().toISOString().slice(0, 19)

export type RouteFormPatch = Partial<
  Pick<Route, 'startWarehouseId' | 'returnToStart' | 'vehicleId' | 'driverId' | 'date' | 'startTime' | 'notes'>
>

type RouteImmutableField = 'id' | 'stops' | 'activity' | 'createdAt' | 'createdBy'

export type RouteUpdate = Omit<Partial<Route>, RouteImmutableField | 'isDraft'> &
  Partial<Record<RouteImmutableField | 'isDraft', never>>

const dispatchRouteResources = (route: Route) => {
  const warehouse = useWarehousesStore.getState().warehouses.find(w => w.id === route.startWarehouseId)
  const pickupWindowStart = `${route.date}T${route.startTime}`

  for (const stop of route.stops) {
    useShipmentsStore.getState().createShipmentForRoute({
      orderId: stop.orderId,
      originHub: warehouse?.name ?? '',
      originLat: warehouse?.lat,
      originLng: warehouse?.lng,
      pickupWindowStart,
      vehicleId: route.vehicleId,
      driverId: route.driverId
    })
  }

  if (!route.vehicleId || !warehouse) return

  const stops = route.stops.map(stop => ({
    id: stop.id,
    label: stop.address,
    lat: stop.lat,
    lng: stop.lng,
    completed: stop.status === 'completed'
  }))

  const nextStop = stops.find(stop => !stop.completed)

  useVehiclesStore.getState().updateVehicle(route.vehicleId, {
    trackingStatus: 'on_route',
    operationalStatus: 'on_route',
    lat: warehouse.lat,
    lng: warehouse.lng,
    path: [[warehouse.lat, warehouse.lng], ...route.stops.map(stop => [stop.lat, stop.lng] as [number, number])],
    stops,
    stopsCompleted: stops.filter(stop => stop.completed).length,
    stopsTotal: stops.length,
    etaAt: nextStop ? route.stops.find(stop => stop.id === nextStop.id)?.etaAt : undefined,
    delayMinutes: undefined,
    hasAlert: false,
    distanceRemainingKm: getRouteDistanceKm(route, warehouse),
    nextStopLabel: nextStop?.label ?? warehouse.name,
    currentLocationLabel: warehouse.name,
    currentAssignment: {
      routeId: route.id,
      routeName: route.number,
      shipmentId: '',
      shipmentName: `${route.stops.length} stop${route.stops.length === 1 ? '' : 's'}`,
      origin: warehouse.name,
      destination: route.stops[route.stops.length - 1]?.address ?? warehouse.name,
      nextStop: nextStop?.label ?? warehouse.name,
      etaLabel: nextStop ? `Today ${(route.stops[0]?.etaAt ?? '').slice(11, 16)}` : '—'
    }
  })
}

const immutable = (route: Route): Pick<Route, RouteImmutableField> => ({
  id: route.id,
  stops: route.stops,
  activity: route.activity,
  createdAt: route.createdAt,
  createdBy: route.createdBy
})

let eventSeq = 0

const eventId = (routeId: string, kind: string) => `ract-${routeId}-${kind}-${++eventSeq}`

const buildEmptyRoute = (id: string): Route => {
  const createdAt = now()

  return {
    id,
    number: '',
    status: 'draft',
    date: '',
    startTime: '08:00',
    startWarehouseId: '',
    returnToStart: true,
    notes: '',
    stops: [],

    activity: [
      {
        id: eventId(id, 'created'),
        label: 'Route created',
        actor: CURRENT_OPERATOR,
        timestamp: createdAt,
        icon: 'file-plus-2'
      }
    ],
    isDraft: true,
    createdAt,
    createdBy: CURRENT_OPERATOR,
    dispatchedAt: null,
    completedAt: null
  }
}

const prepend = (route: Route, event: RouteActivityEvent): RouteActivityEvent[] => [event, ...route.activity]

const settledStatus = (route: Route): Route['status'] => (route.vehicleId && route.driverId ? 'ready' : 'planned')

const isDraftRoute = (route: Route): boolean => route.status === 'draft'

const applyStops = (route: Route, stops: RouteStop[], warehouse?: Warehouse): Route => ({
  ...route,
  stops: computeEtas(resequence(stops), warehouse, route.date, route.startTime)
})

const applySchedule = (prev: Route, next: Route, warehouse?: Warehouse): Route =>
  prev.date !== next.date || prev.startTime !== next.startTime || prev.startWarehouseId !== next.startWarehouseId
    ? applyStops(next, next.stops, warehouse)
    : next

const mapRoute = (routes: Route[], id: string, fn: (route: Route) => Route): Route[] => {
  let changed = false

  const next = routes.map(route => {
    if (route.id !== id) return route

    const updated = fn(route)

    if (updated !== route) changed = true

    return updated
  })

  return changed ? next : routes
}

interface RoutesState {
  routes: Route[]

  initialize: (routes: Route[]) => void
  getRoute: (id: string) => Route | undefined
  createDraftRoute: (id: string) => void
  saveRouteDraft: (id: string, patch: RouteFormPatch, warehouse?: Warehouse) => void
  commitRoute: (id: string, patch: RouteFormPatch, warehouse?: Warehouse) => void
  updateRoute: (id: string, updates: RouteUpdate, warehouse?: Warehouse) => void
  dispatchRoute: (id: string) => boolean
  cancelRoute: (id: string) => void
  duplicateRoute: (id: string) => string

  addStops: (id: string, stops: RouteStop[], warehouse?: Warehouse) => void
  removeStop: (id: string, stopId: string, warehouse?: Warehouse) => void
  reorderStops: (id: string, stopIds: string[], warehouse?: Warehouse) => void
  updateStop: (id: string, stopId: string, patch: Partial<RouteStop>, warehouse?: Warehouse) => void
}

export const useRoutesStore = create<RoutesState>()((set, get) => ({
  routes: [],

  initialize: routes => {
    if (get().routes.length > 0) return
    set({ routes })
  },

  getRoute: id => get().routes.find(r => r.id === id),

  createDraftRoute: id => {
    if (get().routes.some(r => r.id === id)) return
    set(state => ({ routes: [buildEmptyRoute(id), ...state.routes] }))
  },

  saveRouteDraft: (id, patch, warehouse) =>
    set(state => ({
      routes: mapRoute(state.routes, id, route => {
        if (!isDraftRoute(route)) return route

        return applySchedule(
          route,
          {
            ...route,
            ...patch,
            ...immutable(route),
            number: route.number || nextRouteNumber(state.routes),
            dispatchedAt: route.dispatchedAt,
            completedAt: route.completedAt,
            status: 'draft',
            isDraft: true
          },
          warehouse
        )
      })
    })),

  commitRoute: (id, patch, warehouse) => {
    const stamp = now()

    set(state => ({
      routes: mapRoute(state.routes, id, route => {
        if (!isDraftRoute(route)) return route

        const next = applySchedule(
          route,
          {
            ...route,
            ...patch,
            ...immutable(route),
            dispatchedAt: route.dispatchedAt,
            completedAt: route.completedAt,
            number: route.number || nextRouteNumber(state.routes),
            isDraft: false
          },
          warehouse
        )

        return {
          ...next,
          status: settledStatus(next),
          activity: prepend(route, {
            id: eventId(id, 'sequenced'),
            label: 'Stops sequenced',
            actor: route.createdBy || CURRENT_OPERATOR,
            timestamp: stamp,
            icon: 'route'
          })
        }
      })
    }))
  },

  updateRoute: (id, updates, warehouse) =>
    set(state => ({
      routes: mapRoute(state.routes, id, route => {
        const next = applySchedule(
          route,
          { ...route, ...updates, ...immutable(route), isDraft: route.isDraft },
          warehouse
        )

        const settles = updates.status === undefined && (route.status === 'planned' || route.status === 'ready')

        return settles ? { ...next, status: settledStatus(next) } : next
      })
    })),

  dispatchRoute: id => {
    const route = get().getRoute(id)

    if (!route || route.status !== 'ready') return false

    const stamp = now()

    dispatchRouteResources(route)

    set(state => ({
      routes: mapRoute(state.routes, id, current => ({
        ...current,
        status: 'in_progress',
        dispatchedAt: stamp,
        activity: prepend(current, {
          id: eventId(id, 'dispatched'),
          label: 'Dispatched',
          actor: current.createdBy || CURRENT_OPERATOR,
          timestamp: stamp,
          icon: 'truck'
        })
      }))
    }))

    return true
  },

  cancelRoute: id => {
    const route = get().getRoute(id)

    if (!route || (route.status !== 'draft' && route.status !== 'planned' && route.status !== 'ready')) return

    const stamp = now()

    set(state => ({
      routes: mapRoute(state.routes, id, current => ({
        ...current,
        status: 'cancelled',
        activity: prepend(current, {
          id: eventId(id, 'cancelled'),
          label: 'Route cancelled',
          actor: current.createdBy || CURRENT_OPERATOR,
          timestamp: stamp,
          icon: 'ban'
        })
      }))
    }))
  },

  duplicateRoute: id => {
    const source = get().getRoute(id)

    if (!source) return ''

    const newId = crypto.randomUUID()
    const stamp = now()

    const duplicate: Route = {
      ...source,
      id: newId,
      number: '',
      status: 'draft',
      isDraft: true,
      stops: source.stops.map((stop, index) => ({ ...stop, id: `${newId}-s${index + 1}`, status: 'pending' })),
      createdAt: stamp,
      createdBy: CURRENT_OPERATOR,
      dispatchedAt: null,
      completedAt: null,
      activity: [
        {
          id: eventId(newId, 'created'),
          label: `Duplicated from ${source.number || 'draft'}`,
          actor: CURRENT_OPERATOR,
          timestamp: stamp,
          icon: 'file-plus-2'
        }
      ]
    }

    set(state => ({ routes: [duplicate, ...state.routes] }))

    return newId
  },

  addStops: (id, stops, warehouse) =>
    set(state => ({
      routes: mapRoute(state.routes, id, route => applyStops(route, [...route.stops, ...stops], warehouse))
    })),

  removeStop: (id, stopId, warehouse) =>
    set(state => ({
      routes: mapRoute(state.routes, id, route =>
        applyStops(
          route,
          route.stops.filter(s => s.id !== stopId),
          warehouse
        )
      )
    })),

  reorderStops: (id, stopIds, warehouse) =>
    set(state => ({
      routes: mapRoute(state.routes, id, route => {
        const byId = new Map(route.stops.map(s => [s.id, s]))
        const ordered = stopIds.map(sid => byId.get(sid)).filter((s): s is RouteStop => Boolean(s))

        const covers = ordered.length === route.stops.length && new Set(stopIds).size === route.stops.length

        return covers ? applyStops(route, ordered, warehouse) : route
      })
    })),

  updateStop: (id, stopId, patch, warehouse) =>
    set(state => ({
      routes: mapRoute(state.routes, id, route =>
        applyStops(
          route,
          route.stops.map(s => (s.id === stopId ? { ...s, ...patch } : s)),
          warehouse
        )
      )
    }))
}))
