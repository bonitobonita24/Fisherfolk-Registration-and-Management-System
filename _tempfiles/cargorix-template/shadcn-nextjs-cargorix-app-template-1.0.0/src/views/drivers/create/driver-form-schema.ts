// Third-party Imports
import { z } from 'zod'

// Type Imports
import type { DriverShift, HomeTime, PayType } from '@/types/entities/driver'
import { DRIVER_TYPE_LIST, LICENSE_CLASS_LIST } from '@/types/entities/driver'

// Util Imports
import { DOB_MIN_DATE, MIN_DRIVING_AGE, dobMaxDate, isBeforeDate } from '@/lib/date-bounds'

// Data Imports
import { DRIVER_TYPE_LABEL, HOME_TIME_LABEL, LICENSE_CLASS_LABEL, PAY_TYPE_LABEL, SHIFT_LABEL } from '../driver-badges'

export const driverFormSchema = z.object({
  driverId: z
    .string()
    .min(1, 'Enter a driver ID')
    .regex(/^[A-Za-z0-9-]+$/, 'Use letters, numbers and hyphens only'),
  avatarUrl: z.string().optional().default(''),
  firstName: z.string().min(1, 'Enter a first name'),
  lastName: z.string().min(1, 'Enter a last name'),
  dob: z
    .string()
    .min(1, 'Select a date of birth')
    .refine(value => !isBeforeDate(value, DOB_MIN_DATE), `Date of birth cannot be before ${DOB_MIN_DATE}`)
    .refine(value => !isBeforeDate(dobMaxDate(), value), `Driver must be at least ${MIN_DRIVING_AGE} years old`),
  gender: z.string().optional().default(''),
  nationality: z.string().optional().default(''),
  languages: z.array(z.string()).optional().default([]),
  hireDate: z.string().optional().default(''),
  phone: z.string().min(1, 'Enter a phone number'),
  email: z.string().min(1, 'Enter an email').email('Enter a valid email'),
  address: z.string().min(1, 'Enter an address'),
  city: z.string().min(1, 'Enter a city'),
  state: z.string().min(1, 'Enter a state'),
  zip: z.string().optional().default(''),
  licenseNumber: z.string().min(1, 'Enter a license number'),
  licenseClass: z.string().min(1, 'Select a license class'),
  licenseState: z.string().min(1, 'Enter a license state'),
  licenseExpiry: z.string().min(1, 'Select a license expiry'),
  endorsements: z.array(z.string()).optional().default([]),
  medicalCardExpiry: z.string().min(1, 'Select a medical card expiry'),
  drugTestDue: z.string().optional().default(''),
  homeHubId: z.string().min(1, 'Select a home hub'),
  assignedVehicleId: z.string().optional().default(''),
  operatingZone: z.string().optional().default(''),
  shift: z.string().min(1, 'Select a shift'),
  driverType: z.string().optional().default(''),
  homeTime: z.string().optional().default(''),
  payType: z.string().optional().default(''),
  employmentStatus: z.string().min(1, 'Select a status'),
  safetyScore: z.coerce.number().optional(),
  emergencyName: z.string().min(1, 'Enter a contact name'),
  emergencyRelationship: z.string().min(1, 'Select a relationship'),
  emergencyPhone: z.string().min(1, 'Enter a contact phone'),
  emergencyAltPhone: z.string().optional().default(''),
  notes: z.string().optional().default('')
})

export type CreateDriverFormInput = z.input<typeof driverFormSchema>
export type CreateDriverFormValues = z.infer<typeof driverFormSchema>

export const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' }
]

export const OPERATING_ZONE_OPTIONS = [
  { label: 'Northeast Corridor', value: 'Northeast Corridor' },
  { label: 'Southeast', value: 'Southeast' },
  { label: 'Gulf Coast', value: 'Gulf Coast' },
  { label: 'Midwest', value: 'Midwest' },
  { label: 'South Central', value: 'South Central' },
  { label: 'Southwest Region', value: 'Southwest Region' },
  { label: 'Mountain West', value: 'Mountain West' },
  { label: 'Pacific Northwest', value: 'Pacific Northwest' }
]

export const DRIVER_TYPE_OPTIONS = DRIVER_TYPE_LIST.map(type => ({ label: DRIVER_TYPE_LABEL[type], value: type }))

export const HOME_TIME_OPTIONS = (['daily', 'weekly', 'biweekly', 'monthly'] as HomeTime[]).map(homeTime => ({
  label: HOME_TIME_LABEL[homeTime],
  value: homeTime
}))

export const PAY_TYPE_OPTIONS = (['per_mile', 'hourly', 'salary', 'percentage'] as PayType[]).map(payType => ({
  label: PAY_TYPE_LABEL[payType],
  value: payType
}))

export const LICENSE_CLASS_OPTIONS = LICENSE_CLASS_LIST.map(cls => ({ label: LICENSE_CLASS_LABEL[cls], value: cls }))

export const SHIFT_OPTIONS = (['day', 'night'] as DriverShift[]).map(shift => ({
  label: SHIFT_LABEL[shift],
  value: shift
}))

export const RELATIONSHIP_OPTIONS = [
  { label: 'Spouse', value: 'Spouse' },
  { label: 'Parent', value: 'Parent' },
  { label: 'Sibling', value: 'Sibling' },
  { label: 'Child', value: 'Child' },
  { label: 'Friend', value: 'Friend' },
  { label: 'Other', value: 'Other' }
]

export const ENDORSEMENT_SUGGESTIONS = ['HAZMAT', 'Tanker', 'Double/Triple Trailers', 'Passenger', 'School Bus']
