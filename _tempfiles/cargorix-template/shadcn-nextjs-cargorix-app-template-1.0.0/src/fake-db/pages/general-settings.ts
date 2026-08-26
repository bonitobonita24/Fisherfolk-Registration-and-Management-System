// Type Imports
import type { GeneralSettings } from '@/types/pages/general-settings'

export const db: GeneralSettings = {
  companyName: 'Cargorix Logistics Inc.',
  supportEmail: 'support@cargorix.com',
  phone: '+1 (555) 014-2280',
  website: 'https://www.cargorix.com',
  address: '4400 Commerce Parkway\nDallas, TX 75201\nUnited States',
  taxId: '84-3120945',
  logoName: null,
  timezone: '(UTC-06:00) Central Time',
  language: 'en-US',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  weightUnit: 'kg',
  distanceUnit: 'mi',
  dimensionUnit: 'cm',
  orderPrefix: 'ORD-',
  shipmentPrefix: 'SHP-',
  poPrefix: 'PO-',
  transferPrefix: 'TRF-',
  adjustmentPrefix: 'ADJ-',
  defaultOrderStatus: 'pending',
  defaultWarehouseId: 'wh-bronx',
  reorderMethod: 'min_max'
}
