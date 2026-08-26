// Type Imports
import type { ServiceLevel } from '@/types/entities/order'

export type ShipmentStatus = 'draft' | 'scheduled' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned'

export interface ShipmentTimelineEvent {
  id: string
  label: string
  timestamp?: string
  state: 'done' | 'current' | 'pending'
}

export interface Shipment {
  id: string
  displayId: string
  orderId: string
  status: ShipmentStatus
  createdAt: string
  isDraft?: boolean

  serviceLevel: ServiceLevel
  originHub: string
  pickupWindowStart: string
  pickupWindowEnd: string
  deliveryDeadline: string
  routeType: string
  distanceKm: number
  etaMinutes: number

  driverId?: string
  vehicleId?: string
  carrier: string
  trackingDeviceId?: string

  generateLabels: boolean
  sendTrackingLink: boolean
  requireProofOfDelivery: boolean
  driverInstructions?: string

  progressPercent: number

  failureReason?: string

  priorityPackageIds: string[]

  timeline: ShipmentTimelineEvent[]
}
