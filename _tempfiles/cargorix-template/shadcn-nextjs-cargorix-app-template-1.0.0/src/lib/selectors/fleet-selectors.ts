// Third-party Imports
import { differenceInCalendarDays, format } from 'date-fns'

// Type Imports
import type { ExportTable } from '@/types'
import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'
import type { ComplianceDocType, Vehicle, VehicleStop } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Util Imports
import { excludeDrafts } from '@/lib/exclude-drafts'

export const getFleetKpis = (vehicles: Vehicle[]) => {
  const live = excludeDrafts(vehicles)

  return {
    activeVehicles: live.length,
    onRoute: live.filter(v => v.trackingStatus === 'on_route').length,
    delayed: live.filter(v => v.trackingStatus === 'delayed').length,
    alerts: live.filter(v => v.hasAlert).length
  }
}

export interface VehicleStats {
  nextStop: string
  eta: string
  distanceRemaining: string
  stopsCompleted: string
  delayAlerts: string
}

export const getVehicleStats = (vehicle: Vehicle): VehicleStats => {
  const delayAlerts = vehicle.delayMinutes ? `+${vehicle.delayMinutes} min` : 'None'

  if (vehicle.trackingStatus === 'idle') {
    return {
      nextStop: vehicle.currentLocationLabel ?? 'Unknown',
      eta: '—',
      distanceRemaining: '—',
      stopsCompleted: '—',
      delayAlerts: 'None'
    }
  }

  return {
    nextStop: vehicle.nextStopLabel ?? '—',
    eta: vehicle.etaAt ? format(new Date(vehicle.etaAt), 'HH:mm') : '—',
    distanceRemaining: vehicle.distanceRemainingKm !== undefined ? `${vehicle.distanceRemainingKm} km` : '—',
    stopsCompleted: `${vehicle.stopsCompleted} of ${vehicle.stopsTotal}`,
    delayAlerts
  }
}

export const buildVehicleTracking = (order: Order, shipment: Shipment): Partial<Vehicle> => {
  const progress = Math.min(100, Math.max(0, shipment.progressPercent)) / 100
  const delivered = shipment.status === 'delivered'
  const returned = shipment.status === 'returned'
  const finished = delivered || returned

  const stops: VehicleStop[] = [
    {
      id: `${shipment.id}-pickup`,
      label: order.pickupAddress,
      lat: order.pickupLat,
      lng: order.pickupLng,
      completed: progress > 0
    },
    {
      id: `${shipment.id}-delivery`,
      label: order.deliveryAddress,
      lat: order.deliveryLat,
      lng: order.deliveryLng,
      completed: delivered
    }
  ]

  const nextStop = stops.find(stop => !stop.completed) ?? stops[stops.length - 1]
  const remainingMinutes = Math.round(order.etaMinutes * (1 - progress))

  const etaAt = finished
    ? undefined
    : shipment.status === 'scheduled'
      ? shipment.pickupWindowStart || undefined
      : new Date(Date.now() + remainingMinutes * 60_000).toISOString()

  return {
    trackingStatus: returned ? 'idle' : delivered ? 'completed' : 'on_route',
    operationalStatus: finished ? 'available' : 'on_route',
    shipmentId: shipment.id,
    lat: order.pickupLat + (order.deliveryLat - order.pickupLat) * progress,
    lng: order.pickupLng + (order.deliveryLng - order.pickupLng) * progress,
    path: [
      [order.pickupLat, order.pickupLng],
      [order.deliveryLat, order.deliveryLng]
    ],
    stops,
    stopsCompleted: stops.filter(stop => stop.completed).length,
    stopsTotal: stops.length,
    etaAt,
    delayMinutes: undefined,
    hasAlert: false,
    distanceRemainingKm: finished ? 0 : Number((order.distanceKm * (1 - progress)).toFixed(1)),
    nextStopLabel: nextStop.label,
    currentLocationLabel: returned ? order.pickupAddress : nextStop.label,
    currentAssignment: finished
      ? undefined
      : {
          routeId: '',
          routeName: '',
          shipmentId: shipment.id,
          shipmentName: shipment.displayId,
          origin: order.pickupAddress,
          destination: order.deliveryAddress,
          nextStop: nextStop.label,
          etaLabel: etaAt ? `Today ${format(new Date(etaAt), 'HH:mm')}` : '—'
        }
  }
}

export const getCapacityKg = (v: Vehicle): number => Math.round(v.capacityTons * 1000)

export type MaintenanceSeverity = 'ok' | 'due_soon' | 'overdue' | 'in_service'

export const getMaintenanceStatus = (
  v: Vehicle,
  asOf: Date = new Date('2026-05-22')
): { label: string; severity: MaintenanceSeverity; detail: string } => {
  if (v.operationalStatus === 'maintenance') return { label: 'In Service', severity: 'in_service', detail: '—' }
  if (!v.nextServiceAt) return { label: '—', severity: 'ok', detail: '—' }

  const days = differenceInCalendarDays(new Date(v.nextServiceAt), asOf)
  const label = format(new Date(v.nextServiceAt), 'dd MMM yyyy')

  const detail = v.nextServiceOdometerKm
    ? `in ${(v.nextServiceOdometerKm - (v.odometerKm ?? 0)).toLocaleString()} km`
    : ''

  if (days < 0) return { label, severity: 'overdue', detail }
  if (days <= 30) return { label, severity: 'due_soon', detail }

  return { label, severity: 'ok', detail }
}

export const getComplianceExpiry = (v: Vehicle, type: ComplianceDocType): string | undefined =>
  v.complianceDocs?.find(d => d.type === type)?.expiry

export const getVehicleReadiness = (v: Partial<Vehicle>): { label: string; done: boolean }[] => [
  { label: 'Vehicle type selected', done: Boolean(v.type) },
  { label: 'Registration number added', done: Boolean(v.registrationNo) },
  { label: 'Manufacturer and model selected', done: Boolean(v.make && v.model) },
  { label: 'Year specified', done: Boolean(v.year) },
  { label: 'Warehouse selected', done: Boolean(v.homeWarehouseId) },
  { label: 'Capacity information entered', done: Boolean(v.capacityTons) },
  { label: 'Operating status selected', done: Boolean(v.operationalStatus && v.operationalStatus !== 'draft') },
  { label: 'Compliance fields completed', done: Boolean((v.complianceDocs?.length ?? 0) > 0) }
]

export interface MaintenanceComplianceRow {
  id: string
  label: string
  registrationNo: string
  nextServiceLabel: string
  nextServiceDetail: string
  registrationExpiry?: string
  insuranceExpiry?: string
  inspectionIssues: string[]
}

export const getMaintenanceComplianceRows = (vehicles: Vehicle[]): MaintenanceComplianceRow[] =>
  vehicles
    .filter(v => !v.isDraft && ((v.inspectionIssues?.length ?? 0) > 0 || getMaintenanceStatus(v).severity !== 'ok'))
    .map(v => ({
      id: v.id,
      label: `${v.id} (${v.make} ${v.model})`,
      registrationNo: v.registrationNo ?? '—',
      nextServiceLabel: getMaintenanceStatus(v).label,
      nextServiceDetail: getMaintenanceStatus(v).detail,
      registrationExpiry: getComplianceExpiry(v, 'registration'),
      insuranceExpiry: getComplianceExpiry(v, 'insurance'),
      inspectionIssues: v.inspectionIssues ?? []
    }))

export const MAINTENANCE_STATUS_OPTIONS: { label: string; value: MaintenanceSeverity | 'all' }[] = [
  { label: 'All maintenance', value: 'all' },
  { label: 'OK', value: 'ok' },
  { label: 'Due soon', value: 'due_soon' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'In service', value: 'in_service' }
]

export interface FleetCsvContext {
  drivers: Driver[]
  warehouses: Warehouse[]
  getTypeLabel: (vehicle: Vehicle) => string
  getStatusLabel: (vehicle: Vehicle) => string
}

export const buildFleetExport = (list: Vehicle[], context: FleetCsvContext): ExportTable => {
  const { drivers, warehouses, getTypeLabel, getStatusLabel } = context

  const headers = [
    'Vehicle',
    'Make',
    'Model',
    'Registration',
    'Type',
    'Assigned Driver',
    'Current Assignment',
    'Assignment Route',
    'Home Warehouse',
    'Capacity (kg)',
    'Mileage (km)',
    'Status',
    'Next Maintenance',
    'Maintenance Detail',
    'Maintenance Status'
  ]

  const driverNameById = new Map(drivers.map(d => [d.id, d.name]))
  const warehouseNameById = new Map(warehouses.map(w => [w.id, w.name]))

  const rows = list.map(row => {
    const maintenance = getMaintenanceStatus(row)
    const assignment = row.currentAssignment

    return [
      row.id,
      row.make ?? '',
      row.model ?? '',
      row.registrationNo ?? '',
      getTypeLabel(row),
      driverNameById.get(row.assignedDriverId ?? '') ?? '',
      assignment?.shipmentName ?? '',
      assignment ? `${assignment.origin} → ${assignment.destination}` : '',
      warehouseNameById.get(row.homeWarehouseId ?? '') ?? '',
      `${getCapacityKg(row)}`,
      `${row.odometerKm ?? 0}`,
      getStatusLabel(row),
      maintenance.label === '—' ? '' : maintenance.label,
      maintenance.detail === '—' ? '' : maintenance.detail,
      MAINTENANCE_STATUS_OPTIONS.find(option => option.value === maintenance.severity)?.label ?? maintenance.severity
    ]
  })

  return { headers, rows }
}
