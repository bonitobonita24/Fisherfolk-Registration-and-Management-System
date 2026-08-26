export type WarehouseType =
  | 'Distribution Centre'
  | 'Fulfillment Center'
  | 'Cross-dock'
  | 'Cold Storage'
  | 'Returns Center'

export const WAREHOUSE_TYPE_LIST: WarehouseType[] = [
  'Distribution Centre',
  'Fulfillment Center',
  'Cross-dock',
  'Cold Storage',
  'Returns Center'
]

export type WarehouseStatus = 'active' | 'inactive' | 'maintenance'

export const WAREHOUSE_STATUS_LIST: WarehouseStatus[] = ['active', 'inactive', 'maintenance']

export type DockDirection = 'inbound' | 'outbound'

export type DockStatus = 'scheduled' | 'arriving' | 'loading' | 'loaded' | 'completed'

export interface DockAppointment {
  id: string
  reference: string
  direction: DockDirection
  dock: string
  windowStart: string
  windowEnd: string
  carrier: string
  status: DockStatus
}

export interface WarehouseZone {
  id: string
  name: string
  category: string
  usedBins: number
  totalBins: number
}

export interface WarehouseAddress {
  line1: string
  city: string
  state: string
  country: string
  postalCode: string
}

export interface WarehouseTodaySnapshot {
  inboundPOs: number
  outboundShipments: number
  dockQueueWaiting: number
}

export interface Warehouse {
  id: string
  name: string
  code: string
  type: WarehouseType
  status: WarehouseStatus

  location: string
  address: string
  addressParts: WarehouseAddress
  lat: number
  lng: number

  managerId: string
  email: string
  phone: string
  timezone: string
  operatingHours: string
  openedDate: string

  maxCapacity: number
  dockCount: number
  zoneCount: number
  allowInbound: boolean
  allowOutbound: boolean

  zones: WarehouseZone[]
  dockSchedule: DockAppointment[]
  today: WarehouseTodaySnapshot
}

export type WarehouseHealthStatus = 'healthy' | 'stable' | 'attention'

export interface WarehouseStockSummary {
  id: string
  name: string
  location: string
  status: WarehouseHealthStatus
  capacityUsedPercent: number
  maxCapacity: number
  skuCount: number
  unitCount: number
  value: string
  lowStockCount: number
  outOfStockCount: number
}

export interface WarehouseInventoryRow {
  productId: string
  sku: string
  name: string
  primaryImage: string
  onHand: number
  reserved: number
  available: number
  reorderPoint: number
}

export interface WarehouseInventory {
  warehouseId: string
  unitsStored: number
  skuCount: number
  reserved: number
  available: number
  rows: WarehouseInventoryRow[]
}

export type WarehouseCapacityStatus = 'ok' | 'high' | 'full' | 'over'

export interface WarehouseCapacity {
  warehouseId: string
  warehouseName: string
  unitsStored: number
  maxCapacity: number
  freeSpace: number
  utilization: number
  status: WarehouseCapacityStatus
}

export interface WarehouseIntakeCheck extends WarehouseCapacity {
  ok: boolean
  incomingUnits: number
  overBy: number
}

export interface WarehouseOverviewRow extends Warehouse {
  manager: string
  unitsStored: number
  skuCount: number
  utilizationPercent: number
}

export interface DockScheduleRow extends DockAppointment {
  warehouseId: string
  warehouseName: string
}
