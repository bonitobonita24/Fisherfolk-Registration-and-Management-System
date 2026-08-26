// Type Imports
import type { ShipmentStatus } from '@/types/entities/shipment'

export type FleetStatusKey = 'on_route' | 'delayed' | 'completed' | 'idle'

export const FLEET_STATUS_LIST: FleetStatusKey[] = ['on_route', 'delayed', 'completed', 'idle']

export const FLEET_STATUS_LABELS: Record<FleetStatusKey, string> = {
  on_route: 'On route',
  delayed: 'Delayed',
  completed: 'Completed',
  idle: 'Idle'
}

export type FleetConditionKey = 'excellent' | 'good' | 'due_soon' | 'overdue' | 'in_service'

export const FLEET_CONDITION_LIST: FleetConditionKey[] = ['excellent', 'good', 'due_soon', 'overdue', 'in_service']

export const FLEET_CONDITION_LABELS: Record<FleetConditionKey, string> = {
  excellent: 'Excellent',
  good: 'Good',
  due_soon: 'Service due',
  overdue: 'Overdue',
  in_service: 'In workshop'
}

export const FLEET_CONDITION_DETAILS: Record<FleetConditionKey, string> = {
  excellent: 'Serviced and road-ready',
  good: 'Minor wear logged',
  due_soon: 'Service due within 30 days',
  overdue: 'Service date passed',
  in_service: 'Off the road for repair'
}

export type FulfilmentStageKey = 'packed' | 'shipped' | 'delivered'

export const FULFILMENT_STAGE_LABELS: Record<FulfilmentStageKey, string> = {
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered'
}

export interface FleetStatusBucket {
  status: FleetStatusKey
  count: number
  percentage: number
  distanceRemainingKm: number
}

export interface FleetConditionBucket {
  condition: FleetConditionKey
  count: number
  percentage: number
}

export interface FulfilmentRow {
  label: string
  value: number
  progress: number
}

export interface FulfilmentStage {
  stage: FulfilmentStageKey
  rows: FulfilmentRow[]
}

export interface DeliveryPerformance {
  onTimeRate: number
  routeCompletionRate: number
}

export interface ActiveShipmentRow {
  shipmentId: string
  displayId: string
  vehicleId: string
  registrationNo: string
  origin: string
  destination: string
  eta: string
  status: ShipmentStatus
  progress: number
}

export interface OrdersTrendPoint {
  date: string
  orders: number
  delivered: number
}

export interface OperationsOverviewData {
  ordersTrend: OrdersTrendPoint[]
  deliveredChangePercent: number
  performanceChangePercent: number
}
