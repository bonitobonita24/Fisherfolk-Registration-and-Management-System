// Third-party Imports
import { differenceInCalendarDays, format } from 'date-fns'

// Type Imports
import type { ExportTable } from '@/types'
import type { Driver, DriverAssignedVehicle } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Util Imports
import { excludeDrafts } from '@/lib/exclude-drafts'

const AS_OF = new Date('2026-08-03')

export const getHomeHubName = (driver: Pick<Driver, 'homeHubId'>, warehouses: Warehouse[]) =>
  warehouses.find(warehouse => warehouse.id === driver.homeHubId)?.name ?? ''

const VEHICLE_TYPE_LABEL: Record<Vehicle['type'], string> = {
  truck: 'Truck (Container)',
  van: 'Cargo Van',
  reefer: 'Reefer',
  motorcycle: 'Motorcycle'
}

export const buildDriverAssignment = (order: Order, shipment: Shipment): Partial<Driver> => {
  const finished = shipment.status === 'delivered' || shipment.status === 'returned'

  if (finished) return { status: 'available', currentAssignment: undefined }

  const collected = shipment.progressPercent > 0
  const nextStop = collected ? order.deliveryAddress : order.pickupAddress
  const remainingKm = Number((order.distanceKm * (1 - shipment.progressPercent / 100)).toFixed(1))

  const etaAt =
    shipment.status === 'scheduled'
      ? shipment.pickupWindowStart
      : new Date(
          Date.now() + Math.round(order.etaMinutes * (1 - shipment.progressPercent / 100)) * 60_000
        ).toISOString()

  return {
    status: 'on_route',
    currentAssignment: {
      routeId: '',
      routeName: `${order.pickupAddress} → ${order.deliveryAddress}`,
      shipmentId: shipment.displayId,
      cargo: `${order.packages.length} package${order.packages.length === 1 ? '' : 's'}`,
      origin: order.pickupAddress,
      originAddress: order.pickupAddressDetail,
      destination: order.deliveryAddress,
      destinationAddress: order.deliveryAddressDetail,
      nextStop,
      nextStopDistance: `${remainingKm} km away`,
      etaLabel: etaAt ? `Today, ${format(new Date(etaAt), 'HH:mm')}` : '—'
    }
  }
}

export const toDriverAssignedVehicle = (vehicle: Vehicle): DriverAssignedVehicle => ({
  vehicleId: vehicle.id,
  vehicleNo: vehicle.registrationNo ?? vehicle.id,
  make: vehicle.make ?? '—',
  model: vehicle.model ?? '—',
  typeLabel: VEHICLE_TYPE_LABEL[vehicle.type],
  year: vehicle.year ?? 2024,
  capacityLabel: `${vehicle.capacityTons} Ton`,
  registrationDate: `${vehicle.year ?? 2024}-03-10`
})

export type LicenseSeverity = 'valid' | 'expiring' | 'expired'

export const getLicenseSeverity = (expiry?: string, asOf?: Date): LicenseSeverity => {
  if (!expiry) return 'valid'

  const days = differenceInCalendarDays(new Date(expiry), asOf ?? AS_OF)

  if (days < 0) return 'expired'
  if (days <= 60) return 'expiring'

  return 'valid'
}

export const LICENSE_STATUS_OPTIONS: { label: string; value: LicenseSeverity | 'all' }[] = [
  { label: 'All license statuses', value: 'all' },
  { label: 'Valid', value: 'valid' },
  { label: 'Expiring', value: 'expiring' },
  { label: 'Expired', value: 'expired' }
]

export const getAvailability = (d: Driver): { label: string; className: string; dot: string } => {
  switch (d.employmentStatus) {
    case 'active':
      return { label: 'Available', className: 'text-success', dot: 'bg-success' }
    case 'on_break':
      return { label: 'Limited', className: 'text-warning', dot: 'bg-warning' }
    default:
      return { label: 'Unavailable', className: 'text-muted-foreground', dot: 'bg-muted-foreground' }
  }
}

export interface ComplianceAvailabilityRow {
  id: string
  name: string
  initials: string
  avatarUrl?: string
  licenseExpiry?: string
  licenseSeverity: LicenseSeverity
  medicalExpiry?: string
  medicalSeverity: LicenseSeverity
  availabilityLabel: string
  availabilityClassName: string
  availabilityDot: string
  availabilityNote?: string
  notes: string
}

export const getComplianceAvailabilityRows = (drivers: Driver[], asOf?: Date): ComplianceAvailabilityRow[] =>
  excludeDrafts(drivers)
    .filter(d => {
      const licenseSeverity = getLicenseSeverity(d.licenseExpiry, asOf)
      const medicalSeverity = getLicenseSeverity(d.medicalCardExpiry, asOf)

      return licenseSeverity !== 'valid' || medicalSeverity !== 'valid' || d.employmentStatus !== 'active'
    })
    .map(d => {
      const availability = getAvailability(d)

      return {
        id: d.id,
        name: d.name,
        initials: d.initials,
        avatarUrl: d.avatarUrl,
        licenseExpiry: d.licenseExpiry,
        licenseSeverity: getLicenseSeverity(d.licenseExpiry, asOf),
        medicalExpiry: d.medicalCardExpiry,
        medicalSeverity: getLicenseSeverity(d.medicalCardExpiry, asOf),
        availabilityLabel: availability.label,
        availabilityClassName: availability.className,
        availabilityDot: availability.dot,
        availabilityNote: d.availabilityNote,
        notes: d.notes ?? '—'
      }
    })

export const getDriverReadiness = (d: Partial<Driver>): { label: string; done: boolean }[] => [
  { label: 'Personal Information', done: Boolean(d.firstName && d.lastName && d.dob && d.gender) },
  { label: 'Contact Details', done: Boolean(d.phone && d.email && d.address && d.city && d.state) },
  {
    label: 'License & Compliance',
    done: Boolean(d.licenseNumber && d.licenseClass && d.licenseExpiry && d.licenseState && d.medicalCardExpiry)
  },
  { label: 'Assignment', done: Boolean(d.homeHubId && d.shift && d.employmentStatus) },
  {
    label: 'Emergency Contact',
    done: Boolean(d.emergencyContact?.name && d.emergencyContact?.phone && d.emergencyContact?.relationship)
  },
  { label: 'Documents Uploaded', done: Boolean((d.documents?.length ?? 0) > 0) }
]

export interface ComplianceStatusItem {
  label: string
  compliant: boolean
}

export const getComplianceStatusItems = (d: Driver, asOf?: Date): ComplianceStatusItem[] => {
  const backgroundDoc = d.documents?.find(doc => doc.type === 'background_check')

  return [
    { label: 'License', compliant: getLicenseSeverity(d.licenseExpiry, asOf) === 'valid' },
    { label: 'Medical Card', compliant: getLicenseSeverity(d.medicalCardExpiry, asOf) === 'valid' },
    { label: 'Drug Test', compliant: getLicenseSeverity(d.drugTestDue, asOf) === 'valid' },
    {
      label: 'Background Check',
      compliant: backgroundDoc ? getLicenseSeverity(backgroundDoc.expiry, asOf) === 'valid' : true
    },
    { label: 'Training', compliant: true }
  ]
}

export const getComplianceScore = (d: Driver, asOf?: Date): number => {
  const items = getComplianceStatusItems(d, asOf)
  const compliant = items.filter(i => i.compliant).length

  return Math.round((compliant / items.length) * 100)
}

export interface DriversCsvContext {
  getStatusLabel: (driver: Driver) => string
  getLicenseClassLabel: (driver: Driver) => string
  getShiftLabel: (driver: Driver) => string
  getHomeHubLabel: (driver: Driver) => string
}

export const buildDriversExport = (list: Driver[], context: DriversCsvContext): ExportTable => {
  const { getStatusLabel, getLicenseClassLabel, getShiftLabel, getHomeHubLabel } = context

  const headers = [
    'Driver',
    'Driver ID',
    'Phone',
    'Email',
    'License',
    'License Class',
    'Assigned Vehicle',
    'Vehicle Make',
    'Vehicle Model',
    'Current Assignment',
    'ETA',
    'Home Hub',
    'Shift',
    'Shift Hours',
    'Status',
    'License Expiry',
    'License Status'
  ]

  const rows = list.map(row => {
    const vehicle = row.assignedVehicle
    const assignment = row.currentAssignment
    const severity = getLicenseSeverity(row.licenseExpiry)

    return [
      row.name,
      row.id.toUpperCase(),
      row.phone ?? '',
      row.email ?? '',
      row.licenseNumber ?? '',
      getLicenseClassLabel(row),
      vehicle?.vehicleNo ?? '',
      vehicle?.make ?? '',
      vehicle?.model ?? '',
      assignment?.routeName ?? '',
      assignment?.etaLabel ?? '',
      getHomeHubLabel(row),
      getShiftLabel(row),
      row.shiftHours ?? '',
      getStatusLabel(row),
      row.licenseExpiry ? format(new Date(row.licenseExpiry), 'dd MMM yyyy') : '',
      LICENSE_STATUS_OPTIONS.find(option => option.value === severity)?.label ?? severity
    ]
  })

  return { headers, rows }
}
