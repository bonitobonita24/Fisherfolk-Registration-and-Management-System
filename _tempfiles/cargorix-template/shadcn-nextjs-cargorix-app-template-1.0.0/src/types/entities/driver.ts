export type DriverStatus = 'available' | 'on_route' | 'offline'

export type DriverEmploymentStatus = 'active' | 'on_break' | 'unavailable' | 'inactive'
export const DRIVER_EMPLOYMENT_STATUS_LIST: DriverEmploymentStatus[] = ['active', 'on_break', 'unavailable', 'inactive']

export type DriverShift = 'day' | 'night'

export type LicenseClass = 'class_a' | 'class_b' | 'class_c'
export const LICENSE_CLASS_LIST: LicenseClass[] = ['class_a', 'class_b', 'class_c']

export type DriverType = 'otr' | 'regional' | 'local' | 'dedicated'
export const DRIVER_TYPE_LIST: DriverType[] = ['otr', 'regional', 'local', 'dedicated']

export type PayType = 'per_mile' | 'hourly' | 'salary' | 'percentage'
export type HomeTime = 'daily' | 'weekly' | 'biweekly' | 'monthly'
export type DriverGender = 'male' | 'female' | 'other'

export type DriverDocType = 'license' | 'medical_card' | 'background_check' | 'drug_test'

export interface DriverDocument {
  type: DriverDocType
  number: string
  issuedOn: string
  expiry: string
}

export interface DriverTrip {
  id: string
  date: string
  shipmentId: string
  origin: string
  destination: string
  distanceKm: number
  durationLabel: string
  onTime: boolean
  status: 'completed' | 'late' | 'in_progress'
}

export interface DriverActivityEntry {
  id: string
  label: string
  at: string
  via?: string
}

export interface DriverAssignedVehicle {
  vehicleId: string
  vehicleNo: string
  make: string
  model: string
  typeLabel: string
  year: number
  capacityLabel: string
  registrationDate: string
}

export interface DriverAssignment {
  routeId: string
  routeName: string
  shipmentId: string
  cargo?: string
  origin: string
  originAddress?: string
  destination: string
  destinationAddress?: string
  nextStop: string
  nextStopDistance?: string
  etaLabel: string
}

export interface DriverEmergencyContact {
  name: string
  relationship: string
  phone: string
  altPhone?: string
}

export interface Driver {
  id: string
  name: string
  initials: string
  status: DriverStatus

  employmentStatus?: DriverEmploymentStatus
  isDraft?: boolean
  avatarUrl?: string

  firstName?: string
  lastName?: string
  dob?: string
  gender?: DriverGender
  nationality?: string
  languages?: string[]
  hireDate?: string

  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip?: string

  homeHubId?: string
  shift?: DriverShift
  shiftHours?: string
  driverType?: DriverType
  homeTime?: HomeTime
  payType?: PayType
  operatingZone?: string
  safetyScore?: number
  employeeId?: string
  weeklyOff?: string
  nextOff?: string

  licenseNumber?: string
  licenseClass?: LicenseClass
  licenseState?: string
  licenseExpiry?: string
  endorsements?: string[]
  medicalCardExpiry?: string
  drugTestDue?: string

  availabilityNote?: string
  emergencyContact?: DriverEmergencyContact
  assignedVehicle?: DriverAssignedVehicle
  currentAssignment?: DriverAssignment
  tripHistory?: DriverTrip[]
  documents?: DriverDocument[]
  notes?: string
  notesUpdatedBy?: string
  notesUpdatedAt?: string
  activity?: DriverActivityEntry[]
}
