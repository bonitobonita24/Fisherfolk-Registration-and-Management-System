// Third-party Imports
import { z } from 'zod'

// Type Imports
import { FUEL_TYPE_LIST } from '@/types/entities/vehicle'

// Data Imports
import { FUEL_TYPE_LABEL } from '../vehicle-badges'

export const vehicleFormSchema = z.object({
  vehicleId: z
    .string()
    .min(1, 'Enter a vehicle ID')
    .regex(/^[A-Za-z0-9-]+$/, 'Use letters, numbers and hyphens only'),
  type: z.string().min(1, 'Select a vehicle type'),
  registrationNo: z.string().min(1, 'Enter a registration number'),
  make: z.string().min(1, 'Enter a manufacturer'),
  model: z.string().min(1, 'Enter a model'),
  year: z.coerce.number().min(1, 'Enter a manufacturing year'),
  name: z.string().optional().default(''),
  vin: z.string().optional().default(''),
  engineNo: z.string().optional().default(''),
  fuelType: z.string().optional().default(''),
  operationalStatus: z.string().min(1, 'Select an operating status'),
  homeWarehouseId: z.string().min(1, 'Select a warehouse'),
  assignedDriverId: z.string().optional().default(''),
  capacityKg: z.coerce.number().optional(),
  cargoVolumeM3: z.coerce.number().optional(),
  palletCapacity: z.coerce.number().optional(),
  refrigerated: z.boolean().optional().default(false),
  tempRangeC: z.string().optional().default(''),
  fuelTankCapacityL: z.coerce.number().optional(),
  transmission: z.string().optional().default(''),
  emissionStandard: z.string().optional().default(''),
  dimensions: z.string().optional().default(''),
  odometerKm: z.coerce.number().optional(),
  seatingCapacity: z.coerce.number().optional(),
  axleConfig: z.string().optional().default(''),
  defaultRegion: z.string().optional().default(''),
  operatingZone: z.string().optional().default(''),
  defaultRouteType: z.string().optional().default(''),
  workingHours: z.string().optional().default(''),
  insuranceProvider: z.string().optional().default(''),
  insurancePolicyNo: z.string().optional().default(''),
  insuranceExpiry: z.string().optional().default(''),
  registrationExpiry: z.string().optional().default(''),
  inspectionExpiry: z.string().optional().default(''),
  inspectionCertNumber: z.string().optional().default(''),
  emissionsCertNumber: z.string().optional().default(''),
  emissionsExpiry: z.string().optional().default(''),
  permitNumber: z.string().optional().default(''),
  permitExpiry: z.string().optional().default('')
})

export type CreateVehicleFormInput = z.input<typeof vehicleFormSchema>
export type CreateVehicleFormValues = z.infer<typeof vehicleFormSchema>

export const FUEL_TYPE_OPTIONS = FUEL_TYPE_LIST.map(fuel => ({ label: FUEL_TYPE_LABEL[fuel], value: fuel }))

export const TRANSMISSION_OPTIONS = [
  { label: 'Manual', value: 'manual' },
  { label: 'Automatic', value: 'automatic' }
]

export const REGION_OPTIONS = [
  { label: 'Northeast', value: 'Northeast' },
  { label: 'Southeast', value: 'Southeast' },
  { label: 'Midwest', value: 'Midwest' },
  { label: 'Southwest', value: 'Southwest' },
  { label: 'West', value: 'West' }
]

export const OPERATING_ZONE_OPTIONS = [
  { label: 'Metro', value: 'Metro' },
  { label: 'Regional', value: 'Regional' },
  { label: 'Interstate', value: 'Interstate' },
  { label: 'Statewide', value: 'Statewide' }
]

export const EMISSION_STANDARD_OPTIONS = [
  { label: 'EPA 2010', value: 'EPA 2010' },
  { label: 'EPA GHG14', value: 'EPA GHG14' },
  { label: 'EPA GHG17', value: 'EPA GHG17' },
  { label: 'CARB', value: 'CARB' },
  { label: 'Euro 6', value: 'Euro 6' }
]

export const ROUTE_TYPE_OPTIONS = [
  { label: 'Long-haul', value: 'Long-haul' },
  { label: 'Regional', value: 'Regional' },
  { label: 'Local delivery', value: 'Local delivery' },
  { label: 'Last-mile', value: 'Last-mile' }
]
