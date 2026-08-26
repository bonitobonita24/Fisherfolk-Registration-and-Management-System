// Type Imports
import type { FuelType, VehicleOperationalStatus, VehicleType } from '@/types/entities/vehicle'
import { VEHICLE_STATUS_LIST, VEHICLE_TYPE_LIST } from '@/types/entities/vehicle'

export const VEHICLE_STATUS_BADGE: Record<VehicleOperationalStatus, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-success-soft text-success' },
  on_route: { label: 'On Route', className: 'bg-info-soft text-info' },
  assigned: { label: 'Assigned', className: 'bg-primary text-primary-foreground' },
  maintenance: { label: 'Maintenance', className: 'bg-warning-soft text-warning' },
  out_of_service: { label: 'Out of Service', className: 'bg-destructive/10 text-destructive' },
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' }
}

export const VEHICLE_STATUS_OPTIONS: { label: string; value: VehicleOperationalStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  ...VEHICLE_STATUS_LIST.map(status => ({ label: VEHICLE_STATUS_BADGE[status].label, value: status }))
]

export const VEHICLE_STATUS_FILTER_OPTIONS: { label: string; value: VehicleOperationalStatus | 'all' }[] = [
  ...VEHICLE_STATUS_OPTIONS,
  { label: 'Draft', value: 'draft' }
]

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  truck: 'Truck',
  van: 'Van',
  reefer: 'Reefer',
  motorcycle: 'Motorcycle'
}

export const VEHICLE_TYPE_OPTIONS: { label: string; value: VehicleType | 'all' }[] = [
  { label: 'All types', value: 'all' },
  ...VEHICLE_TYPE_LIST.map(type => ({ label: VEHICLE_TYPE_LABEL[type], value: type }))
]

export const FUEL_TYPE_LABEL: Record<FuelType, string> = {
  diesel: 'Diesel',
  petrol: 'Petrol',
  electric: 'Electric',
  cng: 'CNG',
  hybrid: 'Hybrid'
}
