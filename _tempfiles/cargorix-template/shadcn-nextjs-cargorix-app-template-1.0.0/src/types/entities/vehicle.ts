export type VehicleType = 'truck' | 'van' | 'reefer' | 'motorcycle'
export const VEHICLE_TYPE_LIST: VehicleType[] = ['truck', 'van', 'reefer', 'motorcycle']

export type VehicleTrackingStatus = 'on_route' | 'delayed' | 'completed' | 'idle'

export type VehicleOperationalStatus =
  | 'available'
  | 'on_route'
  | 'assigned'
  | 'maintenance'
  | 'out_of_service'
  | 'draft'

export const VEHICLE_STATUS_LIST: VehicleOperationalStatus[] = [
  'available',
  'on_route',
  'assigned',
  'maintenance',
  'out_of_service'
]

export type FuelType = 'diesel' | 'petrol' | 'electric' | 'cng' | 'hybrid'
export const FUEL_TYPE_LIST: FuelType[] = ['diesel', 'petrol', 'electric', 'cng', 'hybrid']

export type Transmission = 'manual' | 'automatic'

export type ComplianceDocType = 'insurance' | 'registration' | 'inspection' | 'permit' | 'emissions'

export interface ComplianceDoc {
  type: ComplianceDocType
  number: string
  issuedOn: string
  expiry: string
}

export interface MaintenanceRecord {
  id: string
  date: string
  type: string
  description: string
  provider: string
  odometerKm: number
}

export interface VehicleActivityEntry {
  id: string
  label: string
  at: string
}

export interface VehicleAssignment {
  routeId: string
  routeName: string
  shipmentId: string
  shipmentName: string
  origin: string
  destination: string
  nextStop: string
  etaLabel: string
}

export interface VehicleStop {
  id: string
  label: string
  lat: number
  lng: number
  completed: boolean
}

export interface Vehicle {
  id: string
  type: VehicleType
  label: string
  capacityTons: number
  gpsId?: string

  trackingStatus: VehicleTrackingStatus
  lat: number
  lng: number
  path: [number, number][]
  stops: VehicleStop[]
  stopsCompleted: number
  stopsTotal: number
  etaAt?: string
  delayMinutes?: number
  distanceRemainingKm?: number
  nextStopLabel?: string
  currentLocationLabel?: string
  shipmentId?: string
  hasAlert?: boolean

  registrationNo?: string
  make?: string
  model?: string
  year?: number
  name?: string
  vin?: string
  engineNo?: string
  fuelType?: FuelType
  operationalStatus?: VehicleOperationalStatus
  isDraft?: boolean
  homeWarehouseId?: string
  assignedDriverId?: string
  odometerKm?: number
  defaultRegion?: string
  operatingZone?: string
  defaultRouteType?: string
  workingHours?: string
  healthStatus?: 'good' | 'fair' | 'poor'
  cargoVolumeM3?: number
  palletCapacity?: number
  refrigerated?: boolean
  tempRangeC?: string
  fuelTankCapacityL?: number
  transmission?: Transmission
  emissionStandard?: string
  dimensions?: string
  seatingCapacity?: number
  axleConfig?: string
  lastServiceAt?: string
  nextServiceAt?: string
  nextServiceOdometerKm?: number
  inspectionIssues?: string[]
  maintenanceHistory?: MaintenanceRecord[]
  complianceDocs?: ComplianceDoc[]
  insuranceProvider?: string
  insurancePolicyNo?: string
  currentAssignment?: VehicleAssignment
  currentLoadKg?: number
  notes?: string
  activity?: VehicleActivityEntry[]
}
