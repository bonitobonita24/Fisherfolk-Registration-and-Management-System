// Third-party Imports
import { z } from 'zod'

// Type Imports
import type { ReorderMethod, TimeFormat } from '@/types/pages/general-settings'

export const TIMEZONE_OPTIONS = [
  { label: '(UTC-08:00) Pacific Time', value: '(UTC-08:00) Pacific Time' },
  { label: '(UTC-07:00) Mountain Time', value: '(UTC-07:00) Mountain Time' },
  { label: '(UTC-06:00) Central Time', value: '(UTC-06:00) Central Time' },
  { label: '(UTC-05:00) Eastern Time', value: '(UTC-05:00) Eastern Time' },
  { label: '(UTC+00:00) Coordinated Universal Time', value: '(UTC+00:00) Coordinated Universal Time' },
  { label: '(UTC+01:00) Central European Time', value: '(UTC+01:00) Central European Time' }
]

export const LANGUAGE_OPTIONS = [
  { label: 'English (United States)', value: 'en-US' },
  { label: 'English (United Kingdom)', value: 'en-GB' },
  { label: 'Español', value: 'es-ES' },
  { label: 'Français', value: 'fr-FR' },
  { label: 'Deutsch', value: 'de-DE' }
]

export const CURRENCY_OPTIONS = [
  { label: 'USD — US Dollar', value: 'USD' },
  { label: 'EUR — Euro', value: 'EUR' },
  { label: 'GBP — British Pound', value: 'GBP' },
  { label: 'CAD — Canadian Dollar', value: 'CAD' },
  { label: 'MXN — Mexican Peso', value: 'MXN' }
]

export const DATE_FORMAT_OPTIONS = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { label: 'DD MMM YYYY', value: 'DD MMM YYYY' }
]

export const WEIGHT_UNIT_OPTIONS = [
  { label: 'Kilograms (kg)', value: 'kg' },
  { label: 'Pounds (lb)', value: 'lb' },
  { label: 'Tonnes (t)', value: 't' }
]

export const DISTANCE_UNIT_OPTIONS = [
  { label: 'Miles (mi)', value: 'mi' },
  { label: 'Kilometres (km)', value: 'km' }
]

export const DIMENSION_UNIT_OPTIONS = [
  { label: 'Centimetres (cm)', value: 'cm' },
  { label: 'Inches (in)', value: 'in' },
  { label: 'Metres (m)', value: 'm' }
]

export const ORDER_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Ready for shipment', value: 'ready_for_shipment' },
  { label: 'On hold', value: 'on_hold' }
]

export const TIME_FORMAT_OPTIONS = [
  { label: '12-hour (AM/PM)', value: '12h' },
  { label: '24-hour', value: '24h' }
] as const satisfies readonly { label: string; value: TimeFormat }[]

export const REORDER_METHOD_OPTIONS = [
  { label: 'Fixed Quantity', value: 'fixed' },
  { label: 'Min/Max', value: 'min_max' },
  { label: 'Demand Based', value: 'demand' }
] as const satisfies readonly { label: string; value: ReorderMethod }[]

export const generalSettingsSchema = z.object({
  companyName: z.string().min(1, 'Enter a company name'),
  supportEmail: z.string().min(1, 'Enter a support email').email('Enter a valid email'),
  phone: z.string().min(1, 'Enter a phone number'),
  website: z.string().min(1, 'Enter a website').url('Enter a valid URL'),
  address: z.string().min(1, 'Enter a company address'),
  taxId: z.string().min(1, 'Enter a tax ID'),
  logoName: z.string().nullable(),
  timezone: z.string().min(1, 'Select a time zone'),
  language: z.string().min(1, 'Select a language'),
  currency: z.string().min(1, 'Select a currency'),
  dateFormat: z.string().min(1, 'Select a date format'),
  timeFormat: z.enum(['12h', '24h']),
  weightUnit: z.string().min(1, 'Select a weight unit'),
  distanceUnit: z.string().min(1, 'Select a distance unit'),
  dimensionUnit: z.string().min(1, 'Select a dimension unit'),
  orderPrefix: z.string().min(1, 'Enter an order prefix'),
  shipmentPrefix: z.string().min(1, 'Enter a shipment prefix'),
  poPrefix: z.string().min(1, 'Enter a purchase order prefix'),
  transferPrefix: z.string().min(1, 'Enter a transfer prefix'),
  adjustmentPrefix: z.string().min(1, 'Enter an adjustment prefix'),
  defaultOrderStatus: z.string().min(1, 'Select a default order status'),
  defaultWarehouseId: z.string().min(1, 'Select a default warehouse'),
  reorderMethod: z.enum(['fixed', 'min_max', 'demand'])
})

export type GeneralSettingsFormInput = z.infer<typeof generalSettingsSchema>
