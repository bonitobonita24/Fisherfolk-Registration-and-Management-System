// Third-party Imports
import { z } from 'zod'

// Type Imports
import type { WarehouseStatus, WarehouseType } from '@/types/entities/warehouse'
import { WAREHOUSE_STATUS_LIST, WAREHOUSE_TYPE_LIST } from '@/types/entities/warehouse'

export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Enter a warehouse name'),
  code: z.string().min(1, 'Enter a warehouse code'),
  type: z.enum(WAREHOUSE_TYPE_LIST as [WarehouseType, ...WarehouseType[]]),
  status: z.enum(WAREHOUSE_STATUS_LIST as [WarehouseStatus, ...WarehouseStatus[]]),
  line1: z.string().min(1, 'Enter address line 1'),
  city: z.string().min(1, 'Enter a city'),
  state: z.string().min(1, 'Select a state'),
  country: z.string().min(1, 'Select a country'),
  postalCode: z.string().min(1, 'Enter a postal code'),
  managerId: z.string().min(1, 'Select a manager'),
  email: z.string().email('Enter a valid email address').or(z.literal('')).optional().default(''),
  phone: z.string().optional().default(''),
  timezone: z.string().optional().default(''),
  operatingHours: z.string().optional().default(''),
  maxCapacity: z.coerce.number().min(1, 'Enter a capacity of at least 1'),
  dockCount: z.coerce.number().min(1, 'Add at least one dock'),
  zoneCount: z.coerce.number().min(0),
  allowInbound: z.boolean(),
  allowOutbound: z.boolean()
})

export type CreateWarehouseFormInput = z.input<typeof createWarehouseSchema>
export type CreateWarehouseFormValues = z.infer<typeof createWarehouseSchema>

export const US_STATE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Alabama', value: 'AL' },
  { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' },
  { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' },
  { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' },
  { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' },
  { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' },
  { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' },
  { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' },
  { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' },
  { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' },
  { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' },
  { label: 'Wyoming', value: 'WY' }
]

export const COUNTRY_OPTIONS: { label: string; value: string }[] = [
  { label: 'United States', value: 'United States' },
  { label: 'Canada', value: 'Canada' },
  { label: 'Mexico', value: 'Mexico' }
]

export const TIMEZONE_OPTIONS: { label: string; value: string }[] = [
  { label: '(UTC-05:00) Eastern Time', value: '(UTC-05:00) Eastern Time' },
  { label: '(UTC-06:00) Central Time', value: '(UTC-06:00) Central Time' },
  { label: '(UTC-07:00) Mountain Time', value: '(UTC-07:00) Mountain Time' },
  { label: '(UTC-08:00) Pacific Time', value: '(UTC-08:00) Pacific Time' }
]
