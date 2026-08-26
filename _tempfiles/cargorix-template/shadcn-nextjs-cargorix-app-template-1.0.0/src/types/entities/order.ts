export type OrderStatus =
  | 'draft'
  | 'pending_review'
  | 'order_received'
  | 'ready_for_shipment'
  | 'in_fulfilment'
  | 'on_hold'
  | 'completed'
  | 'cancelled'

export type OrderSource = 'manual' | 'api' | 'portal' | 'csv'
export type ServiceLevel = 'regular' | 'express' | 'same_day'
export type OrderPriority = 'normal' | 'high' | 'urgent'
export type HandlingRequirement = 'standard' | 'fragile' | 'temperature_controlled' | 'hazardous'
export type PackageType = 'carton' | 'pallet' | 'container'

export interface OrderPackage {
  id: string
  itemName: string
  packageType: PackageType
  quantity: number
  weightKg: number
  volumeM3: number
  dimensions: string
}

export interface OrderActivityEvent {
  id: string
  label: string
  actor: string
  timestamp: string
  icon: 'badge-check' | 'map-pin-check' | 'file-plus-2' | 'truck' | 'ban' | 'play' | 'pause'

  description?: string
}

export interface Order {
  isDraft?: boolean
  id: string
  displayId: string
  status: OrderStatus
  source: OrderSource
  createdAt: string
  createdBy: string

  entryReason?: string
  customerReference?: string
  internalNote?: string

  clientId: string
  contactName: string
  contactEmail: string
  contactPhone: string
  billingAccount: string
  currency: string

  pickupAddress: string
  pickupAddressDetail?: string
  pickupLat: number
  pickupLng: number
  deliveryAddress: string
  deliveryAddressDetail?: string
  deliveryLat: number
  deliveryLng: number
  requestedPickupAt: string
  requiredDeliveryAt: string
  serviceLevel: ServiceLevel
  priority: OrderPriority

  packages: OrderPackage[]
  declaredValue: number
  handlingRequirement: HandlingRequirement
  customerInstructions?: string

  totalAmount: number
  distanceKm: number
  etaMinutes: number
  tollEstimate: number

  shipmentId?: string

  activity: OrderActivityEvent[]
}
