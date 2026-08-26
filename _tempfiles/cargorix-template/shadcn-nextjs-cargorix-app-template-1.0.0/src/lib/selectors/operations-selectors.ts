// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type {
  ActiveShipmentRow,
  DeliveryPerformance,
  FleetConditionBucket,
  FleetConditionKey,
  FleetStatusBucket,
  FulfilmentStage
} from '@/types/dashboards/operations-overview-types'
import { FLEET_CONDITION_LIST, FLEET_STATUS_LIST } from '@/types/dashboards/operations-overview-types'
import type { Order } from '@/types/entities/order'
import type { Shipment, ShipmentStatus } from '@/types/entities/shipment'
import type { Vehicle } from '@/types/entities/vehicle'

// Util Imports
import { getMaintenanceStatus } from './fleet-selectors'
import { excludeDrafts } from '@/lib/exclude-drafts'

const percentOf = (part: number, total: number): number => (total === 0 ? 0 : Math.round((part / total) * 1000) / 10)

const isMoving = (vehicle: Vehicle): boolean =>
  vehicle.trackingStatus === 'on_route' || vehicle.trackingStatus === 'delayed'

export const getFleetStatusBreakdown = (vehicles: Vehicle[]): FleetStatusBucket[] => {
  const live = excludeDrafts(vehicles)

  return FLEET_STATUS_LIST.map(status => {
    const inStatus = live.filter(vehicle => vehicle.trackingStatus === status)

    return {
      status,
      count: inStatus.length,
      percentage: percentOf(inStatus.length, live.length),
      distanceRemainingKm: Math.round(inStatus.reduce((sum, vehicle) => sum + (vehicle.distanceRemainingKm ?? 0), 0))
    }
  })
}

const getVehicleCondition = (vehicle: Vehicle): FleetConditionKey => {
  if (vehicle.operationalStatus === 'maintenance' || vehicle.operationalStatus === 'out_of_service') {
    return 'in_service'
  }

  const { severity } = getMaintenanceStatus(vehicle)

  if (severity === 'overdue') return 'overdue'
  if (severity === 'due_soon') return 'due_soon'

  if (vehicle.healthStatus !== 'good' || (vehicle.inspectionIssues?.length ?? 0) > 0) return 'good'

  return 'excellent'
}

export const getFleetConditionBreakdown = (vehicles: Vehicle[]): FleetConditionBucket[] => {
  const live = excludeDrafts(vehicles)

  return FLEET_CONDITION_LIST.map(condition => {
    const count = live.filter(vehicle => getVehicleCondition(vehicle) === condition).length

    return {
      condition,
      count,
      percentage: percentOf(count, live.length)
    }
  })
}

const toRows = (entries: { label: string; value: number }[]) => {
  const total = entries.reduce((sum, entry) => sum + entry.value, 0)

  return entries.map(entry => ({ ...entry, progress: percentOf(entry.value, total) }))
}

export const getFulfilmentPipeline = (orders: Order[], shipments: Shipment[]): FulfilmentStage[] => {
  const liveOrders = excludeDrafts(orders)
  const countOrders = (status: Order['status']) => liveOrders.filter(order => order.status === status).length
  const countShipments = (status: Shipment['status']) => shipments.filter(shipment => shipment.status === status).length

  return [
    {
      stage: 'packed',
      rows: toRows([
        { label: 'Pending review', value: countOrders('pending_review') },
        { label: 'Order received', value: countOrders('order_received') },
        { label: 'Ready for shipment', value: countOrders('ready_for_shipment') },
        { label: 'In fulfilment', value: countOrders('in_fulfilment') }
      ])
    },
    {
      stage: 'shipped',
      rows: toRows([
        { label: 'Scheduled', value: countShipments('scheduled') },
        { label: 'In transit', value: countShipments('in_transit') },
        { label: 'Out for delivery', value: countShipments('out_for_delivery') }
      ])
    },
    {
      stage: 'delivered',
      rows: toRows([
        { label: 'Delivered', value: countShipments('delivered') },
        { label: 'Returned', value: countShipments('returned') },
        { label: 'Orders completed', value: countOrders('completed') }
      ])
    }
  ]
}

export const getDeliveryPerformance = (vehicles: Vehicle[]): DeliveryPerformance => {
  const moving = excludeDrafts(vehicles).filter(isMoving)
  const onTime = moving.filter(vehicle => vehicle.trackingStatus !== 'delayed').length

  const stopsCompleted = moving.reduce((sum, vehicle) => sum + vehicle.stopsCompleted, 0)
  const stopsTotal = moving.reduce((sum, vehicle) => sum + vehicle.stopsTotal, 0)

  return {
    onTimeRate: Math.round(percentOf(onTime, moving.length)),
    routeCompletionRate: Math.round(percentOf(stopsCompleted, stopsTotal))
  }
}

const ACTIVE_SHIPMENT_STATUSES: ShipmentStatus[] = ['scheduled', 'in_transit', 'out_for_delivery']

export const getActiveShipments = (shipments: Shipment[], orders: Order[], vehicles: Vehicle[]): ActiveShipmentRow[] =>
  shipments
    .filter(shipment => ACTIVE_SHIPMENT_STATUSES.includes(shipment.status))
    .map(shipment => {
      const order = orders.find(item => item.id === shipment.orderId)
      const vehicle = vehicles.find(item => item.id === shipment.vehicleId)

      return {
        shipmentId: shipment.id,
        displayId: shipment.displayId,
        vehicleId: vehicle?.id ?? '—',
        registrationNo: vehicle?.registrationNo ?? '—',
        origin: shipment.originHub,
        destination: order?.deliveryAddress ?? '—',
        eta: shipment.deliveryDeadline ? format(new Date(shipment.deliveryDeadline), 'd MMM · HH:mm') : '—',
        status: shipment.status,
        progress: shipment.progressPercent
      }
    })
    .sort((a, b) => b.progress - a.progress)
