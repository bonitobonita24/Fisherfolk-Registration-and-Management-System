export type TimeFormat = '12h' | '24h'

export type ReorderMethod = 'fixed' | 'min_max' | 'demand'

export interface GeneralSettings {
  companyName: string
  supportEmail: string
  phone: string
  website: string
  address: string
  taxId: string
  logoName: string | null
  timezone: string
  language: string
  currency: string
  dateFormat: string
  timeFormat: TimeFormat
  weightUnit: string
  distanceUnit: string
  dimensionUnit: string
  orderPrefix: string
  shipmentPrefix: string
  poPrefix: string
  transferPrefix: string
  adjustmentPrefix: string
  defaultOrderStatus: string
  defaultWarehouseId: string
  reorderMethod: ReorderMethod
}
