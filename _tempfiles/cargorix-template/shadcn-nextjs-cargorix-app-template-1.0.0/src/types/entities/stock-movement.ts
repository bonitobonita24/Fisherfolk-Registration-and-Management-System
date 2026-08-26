export type MovementType = 'receipt' | 'sale' | 'adjustment' | 'transfer' | 'return'

export interface StockMovement {
  id: string
  date: string

  type: MovementType

  productId: string
  sku: string
  name: string
  primaryImage: string

  warehouseId: string
  warehouseName: string

  quantity: number
  reference: string
  note: string
}

export interface StockMovementRow extends StockMovement {
  balance: number
}

export const MOVEMENT_TYPE_LIST: MovementType[] = ['receipt', 'sale', 'adjustment', 'transfer', 'return']

export interface ReceiptMovementInput {
  key: string
  date: string
  productId: string
  sku: string
  name: string
  primaryImage: string
  warehouseId: string
  warehouseName: string
  quantity: number
  reference: string
  note: string
}

export interface TransferMovementLineInput {
  lineId: string
  productId: string
  sku: string
  name: string
  primaryImage: string
  quantity: number
}

export interface TransferMovementInput {
  transferId: string
  date: string
  reference: string
  sourceWarehouseId: string
  sourceWarehouseName: string
  destinationWarehouseId: string
  destinationWarehouseName: string
  lines: TransferMovementLineInput[]
}

export interface AdjustmentMovementLineInput {
  lineId: string
  productId: string
  sku: string
  name: string
  primaryImage: string
  quantity: number
}

export interface AdjustmentMovementInput {
  adjustmentId: string
  date: string
  reference: string
  warehouseId: string
  warehouseName: string
  lines: AdjustmentMovementLineInput[]
}
