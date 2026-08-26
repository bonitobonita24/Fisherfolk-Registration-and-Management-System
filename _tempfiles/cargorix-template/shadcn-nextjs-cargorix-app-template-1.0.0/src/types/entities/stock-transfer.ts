export type StockTransferStatus = 'draft' | 'in_transit' | 'completed' | 'cancelled'

export const STOCK_TRANSFER_STATUS_LIST: StockTransferStatus[] = ['draft', 'in_transit', 'completed', 'cancelled']

export interface TransferAttachment {
  id: string
  name: string
  sizeLabel: string
  type: string
}

export interface StockTransferActivityEvent {
  id: string
  label: string
  actor: string
  timestamp: string
  icon: string
}

export interface StockTransferLine {
  id: string
  productId: string
  name: string
  sku: string
  primaryImage: string
  unit: string
  quantitySent: number
  quantityReceived: number
}

export interface StockTransfer {
  isDraft?: boolean
  id: string
  number: string
  status: StockTransferStatus

  sourceWarehouseId: string
  sourceWarehouseName: string
  destinationWarehouseId: string
  destinationWarehouseName: string

  requestedBy: string
  dispatchDate: string
  expectedArrival: string
  notes: string

  transferType: string
  priority: string
  transporter: string
  trackingNumber: string
  reference: string
  remarks: string

  lines: StockTransferLine[]
  attachments: TransferAttachment[]
  activity: StockTransferActivityEvent[]

  createdAt: string
  createdBy: string
  dispatchedAt: string | null
  completedAt: string | null
}

export interface StockTransferTotals {
  totalLines: number
  totalUnitsSent: number
  totalReceived: number
  totalRemaining: number
}
