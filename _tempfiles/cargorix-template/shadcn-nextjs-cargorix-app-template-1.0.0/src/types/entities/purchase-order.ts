export type PurchaseOrderStatus = 'draft' | 'confirmed' | 'in_transit' | 'partially_received' | 'received' | 'cancelled'

export const PURCHASE_ORDER_STATUS_LIST: PurchaseOrderStatus[] = [
  'draft',
  'confirmed',
  'in_transit',
  'partially_received',
  'received',
  'cancelled'
]

export const RECEIVABLE_STATUSES: PurchaseOrderStatus[] = ['confirmed', 'in_transit', 'partially_received']

export const CANCELLABLE_STATUSES: PurchaseOrderStatus[] = ['draft', 'confirmed']

export const TERMINAL_STATUSES: PurchaseOrderStatus[] = ['received', 'cancelled']

export interface SupplierSnapshot {
  supplierId: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
}

export interface PurchaseOrderLine {
  id: string
  productId: string

  name: string
  sku: string
  primaryImage: string
  quantityOrdered: number
  unitCost: number
  taxRatePercent: number
  discountPercent: number
  receivedQty: number
}

export interface PurchaseOrderReceiptLine {
  lineId: string
  quantity: number
}

export interface PurchaseOrderReceipt {
  id: string
  date: string
  receivedBy: string
  note: string
  lines: PurchaseOrderReceiptLine[]
}

export interface PurchaseOrderAttachment {
  id: string
  name: string
  sizeLabel: string
  type: string
}

export interface PurchaseOrderActivityEvent {
  id: string
  label: string
  actor: string
  timestamp: string
  icon: string
}

export interface PurchaseOrder {
  isDraft?: boolean
  id: string
  number: string
  status: PurchaseOrderStatus

  supplierId: string
  supplier: SupplierSnapshot

  warehouseId: string
  warehouseName: string
  deliveryAddress: string

  currency: string
  paymentTerms: string
  buyer: string

  requestedDeliveryDate: string
  expectedDeliveryDate: string

  trackingCarrier: string
  trackingNumber: string

  lines: PurchaseOrderLine[]
  shippingCost: number

  notes: string
  internalNotes: string
  attachments: PurchaseOrderAttachment[]
  receipts: PurchaseOrderReceipt[]
  activity: PurchaseOrderActivityEvent[]

  createdAt: string
  createdBy: string
  confirmedAt: string | null
}

export interface PurchaseOrderLineAmounts {
  gross: number
  discountAmount: number
  net: number
  tax: number
  total: number
}

export interface PurchaseOrderTotals {
  subtotal: number
  discount: number
  tax: number
  shipping: number
  grandTotal: number
  itemCount: number
  totalQuantity: number
}

export interface PurchaseOrderReceivingProgress {
  totalOrdered: number
  totalReceived: number
  totalRemaining: number
  receivedPercent: number
}
