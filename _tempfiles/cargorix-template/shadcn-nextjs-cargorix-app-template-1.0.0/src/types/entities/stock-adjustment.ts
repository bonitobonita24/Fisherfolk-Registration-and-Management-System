export type StockAdjustmentStatus = 'draft' | 'posted' | 'cancelled'

export const STOCK_ADJUSTMENT_STATUS_LIST: StockAdjustmentStatus[] = ['draft', 'posted', 'cancelled']

export type StockAdjustmentReason = 'cycle_count' | 'damage' | 'write_off' | 'found' | 'return_to_stock' | 'correction'

export const STOCK_ADJUSTMENT_REASON_LIST: StockAdjustmentReason[] = [
  'cycle_count',
  'damage',
  'write_off',
  'found',
  'return_to_stock',
  'correction'
]

export interface AdjustmentAttachment {
  id: string
  name: string
  sizeLabel: string
  type: string
}

export interface StockAdjustmentActivityEvent {
  id: string
  label: string
  actor: string
  timestamp: string
  icon: string
}

export interface StockAdjustmentLine {
  id: string
  productId: string
  name: string
  sku: string
  primaryImage: string
  unit: string
  currentQty: number
  adjustmentQty: number
}

export interface StockAdjustment {
  isDraft?: boolean
  id: string
  number: string
  status: StockAdjustmentStatus
  warehouseId: string
  warehouseName: string
  reason: StockAdjustmentReason
  requestedBy: string
  date: string
  notes: string
  lines: StockAdjustmentLine[]
  attachments: AdjustmentAttachment[]
  activity: StockAdjustmentActivityEvent[]
  createdAt: string
  createdBy: string
  postedAt: string | null
}

export interface StockAdjustmentTotals {
  lineCount: number
  totalAdded: number
  totalRemoved: number
  netChange: number
}
